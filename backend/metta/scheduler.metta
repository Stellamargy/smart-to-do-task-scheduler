;; MeTTa Knowledge Base for Automatic Task Scheduling
;; This system automatically schedules tasks when they are created, updated, or dependencies change
;; Enhanced with optimal time allocation and dynamic readjustment algorithms

;; Define task representation
(: task (-> String String String String String Number Number String String))

;; Define priority levels
(= (priority-level 1) low)
(= (priority-level 2) medium)
(= (priority-level 3) high)
(= (priority-level 4) urgent)
(= (priority-level 5) critical)

;; Define optimal time slots based on urgency and priority
(: optimal-time-slot (-> Number Number String))
(= (optimal-time-slot $urgency $priority)
   (if (> $urgency 0.8) "early-morning"    ;; 9:00 AM for critical
       (if (> $urgency 0.6) "morning"      ;; 10:00 AM for urgent
           (if (> $urgency 0.4) "midday"   ;; 12:00 PM for medium
               "afternoon"))))              ;; 2:00 PM for low priority

;; MeTTa Time Optimization Rules
(: metta-optimal-start-time (-> String Number Number String))
(= (metta-optimal-start-time $task-id $urgency $duration)
   (let* (($preferred-slot (optimal-time-slot $urgency (task-priority $task-id)))
          ($available-gap (find-time-gap $preferred-slot $duration)))
     (if (= $available-gap none)
         (find-next-available-slot $duration)
         $available-gap)))

;; Gap-based scheduling optimization
(: find-optimal-gap (-> Number List String))
(= (find-optimal-gap $duration $existing-slots)
   (filter-gaps-by-size $duration (calculate-gaps $existing-slots)))

;; Calculate gaps between scheduled tasks
(: calculate-gaps (-> List List))
(= (calculate-gaps $scheduled-slots)
   (sort-by-start-time 
    (map (lambda ($slot) (gap-between-tasks $slot)) $scheduled-slots)))

;; MeTTa Urgency-based Time Compression
(: compress-schedule-for-urgency (-> String Number))
(= (compress-schedule-for-urgency $task-id $urgency)
   (if (> $urgency 0.9)
       (enable-extended-hours $task-id)    ;; Allow work beyond normal hours
       (if (> $urgency 0.7)
           (reduce-buffer-time $task-id)   ;; Minimize gaps between tasks
           (standard-scheduling $task-id))))

;; Dynamic schedule readjustment when deadlines approach
(: metta-deadline-pressure (-> String String Number))
(= (metta-deadline-pressure $task-id $deadline $current-time)
   (let* (($time-remaining (- $deadline $current-time))
          ($pressure-score (/ 1 (+ 1 $time-remaining))))
     (if (> $pressure-score 0.8)
         (emergency-reschedule $task-id)
         (if (> $pressure-score 0.5)
             (priority-boost $task-id)
             (normal-schedule $task-id)))))

;; Conflict resolution using MeTTa logic
(: resolve-time-conflict (-> String String String))
(= (resolve-time-conflict $task1-id $task2-id)
   (let* (($urgency1 (calculate-urgency $task1-id))
          ($urgency2 (calculate-urgency $task2-id)))
     (if (> $urgency1 $urgency2)
         (bump-task $task2-id $task1-id)
         (bump-task $task1-id $task2-id))))

;; Automatic readjustment triggers
(: metta-readjust-trigger (-> String String))
(= (metta-readjust-trigger "high-priority-added" $user-id)
   (compress-low-priority-tasks $user-id))

(= (metta-readjust-trigger "deadline-approaching" $task-id)
   (emergency-time-allocation $task-id))

(= (metta-readjust-trigger "dependency-completed" $task-id)
   (immediate-schedule-dependents $task-id))

;; Context-switching minimization
(: minimize-context-switching (-> List List))
(= (minimize-context-switching $tasks)
   (group-by-category 
    (sort-by-similarity $tasks)))

;; Energy and focus optimization
(: energy-based-scheduling (-> String String String))
(= (energy-based-scheduling $task-type $time-of-day)
   (if (= $task-type "creative")
       (prefer-morning-hours)
       (if (= $task-type "analytical")
           (prefer-focused-blocks)
           (flexible-timing))))

;; Real-time schedule optimization
(: optimize-realtime (-> String List))
(= (optimize-realtime $user-id)
   (let* (($current-schedule (get-user-schedule $user-id))
          ($optimization-score (calculate-efficiency $current-schedule)))
     (if (< $optimization-score 0.7)
         (trigger-full-reschedule $user-id)
         (minor-adjustments $current-schedule))))

;; MeTTa Predictive Scheduling
(: predict-optimal-completion (-> String Number String))
(= (predict-optimal-completion $task-id $estimated-duration)
   (let* (($historical-data (get-task-history $task-id))
          ($complexity-factor (analyze-complexity $task-id))
          ($adjusted-duration (* $estimated-duration $complexity-factor)))
     (schedule-with-buffer $task-id $adjusted-duration)))

;; Dependency-aware scheduling with immediate updates
(: schedule-dependent-chain (-> String))
(= (schedule-dependent-chain $completed-task-id)
   (let* (($immediate-dependents (get-immediate-dependents $completed-task-id))
          ($newly-available (filter-now-schedulable $immediate-dependents)))
     (map (lambda ($task) (immediate-optimal-schedule $task)) $newly-available)))

;; Load balancing across time periods
(: balance-workload (-> List String))
(= (balance-workload $tasks $time-period)
   (distribute-evenly 
    (sort-by-urgency $tasks) 
    (get-available-time-slots $time-period)))

;; Main MeTTa scheduling algorithm with all optimizations
(: metta-comprehensive-schedule (-> String List))
(= (metta-comprehensive-schedule $user-id)
   (let* (($user-tasks (get-user-tasks $user-id))
          ($schedulable (auto-schedulable-tasks $user-tasks))
          ($optimized-order (apply-all-optimizations $schedulable))
          ($time-allocated (allocate-optimal-times $optimized-order)))
     (apply-schedule-to-database $time-allocated)))

;; Apply all MeTTa optimizations in sequence
(= (apply-all-optimizations $tasks)
   (balance-workload 
    (minimize-context-switching 
     (sort-by-urgency-and-deadline $tasks))))

;; Emergency rescheduling for critical situations
(: emergency-reschedule (-> String))
(= (emergency-reschedule $task-id)
   (let* (($task (get-task $task-id))
          ($remaining-time (- (task-deadline $task) (current-time)))
          ($required-time (task-duration $task)))
     (if (< $remaining-time $required-time)
         (trigger-overtime-mode $task-id)
         (bump-all-lower-priority $task-id))))

;; Quality metrics for schedule optimization
(: schedule-quality-score (-> List Number))
(= (schedule-quality-score $scheduled-tasks)
   (+ (* 0.4 (deadline-adherence-score $scheduled-tasks))
      (* 0.3 (context-switching-efficiency $scheduled-tasks))
      (* 0.2 (workload-balance-score $scheduled-tasks))
      (* 0.1 (buffer-time-adequacy $scheduled-tasks))))

;; Proportional Time Allocation for Competing Deadlines
;; When multiple tasks compete for limited time before shared deadlines
(: proportional-time-allocation (-> List Number List))
(= (proportional-time-allocation $tasks $available-time)
   (let* (($total-required (sum-task-durations $tasks))
          ($allocation-factor (/ $available-time $total-required)))
     (map (lambda ($task) 
       (allocate-proportional-time $task $allocation-factor)) $tasks)))

;; Calculate proportional allocation for a single task
(: allocate-proportional-time (-> String Number Number))
(= (allocate-proportional-time $task-id $allocation-factor)
   (let* (($original-duration (task-duration $task-id))
          ($allocated-time (* $original-duration $allocation-factor))
          ($minimum-time 0.25))  ;; 15 minutes minimum
     (max $allocated-time $minimum-time)))

;; MeTTa Fair Scheduling Rules for Time Conflicts
(: fair-scheduling-when-constrained (-> List String List))
(= (fair-scheduling-when-constrained $competing-tasks $deadline)
   (let* (($available-time (time-until-deadline $deadline))
          ($total-required (sum-task-durations $competing-tasks)))
     (if (> $total-required $available-time)
         (proportional-time-allocation $competing-tasks $available-time)
         (standard-sequential-allocation $competing-tasks))))

;; Deadline grouping for proportional allocation
(: group-by-deadline-proximity (-> List Number List))
(= (group-by-deadline-proximity $tasks $time-threshold)
   (cluster-tasks-by-deadline $tasks $time-threshold))

;; Time pressure calculation
(: calculate-time-pressure (-> List Number))
(= (calculate-time-pressure $task-group)
   (let* (($available-time (min-time-to-deadline $task-group))
          ($required-time (sum-task-durations $task-group)))
     (/ $required-time $available-time)))

;; MeTTa Priority Adjustment under Time Pressure
(: adjust-priority-under-pressure (-> String Number Number))
(= (adjust-priority-under-pressure $task-id $time-pressure)
   (if (> $time-pressure 1.5)  ;; High pressure: 150% oversubscribed
       (boost-critical-tasks $task-id)
       (if (> $time-pressure 1.0)  ;; Medium pressure: oversubscribed
           (apply-proportional-allocation $task-id)
           (standard-priority $task-id))))

;; Minimum viable task completion
(: minimum-viable-completion (-> String Number))
(= (minimum-viable-completion $task-id $pressure-ratio)
   (let* (($original-duration (task-duration $task-id))
          ($minimum-effective (* $original-duration 0.25)))  ;; 25% minimum
     (max $minimum-effective 0.25)))  ;; Never less than 15 minutes

;; Proportional allocation formula implementation
;; Each task gets: (task_duration / total_required_duration) * available_time
(: calculate-fair-share (-> String List Number Number))
(= (calculate-fair-share $task-id $all-tasks $available-time)
   (let* (($task-duration (task-duration $task-id))
          ($total-duration (sum-task-durations $all-tasks))
          ($proportion (/ $task-duration $total-duration)))
     (* $proportion $available-time)))

;; Emergency time compression when severely oversubscribed
(: emergency-time-compression (-> List Number))
(= (emergency-time-compression $tasks $compression-factor)
   (map (lambda ($task) 
     (compress-task-duration $task $compression-factor)) $tasks))

;; Quality preservation under time pressure
(: preserve-quality-under-pressure (-> String Number Number))
(= (preserve-quality-under-pressure $task-id $allocated-time)
   (let* (($original-time (task-duration $task-id))
          ($compression-ratio (/ $allocated-time $original-time)))
     (if (< $compression-ratio 0.5)  ;; Less than 50% of original time
         (flag-quality-risk $task-id)
         (acceptable-compression $task-id))))

;; Define dependency relationships
(: depends-on (-> String String))
(: independent-task (-> String))
(: task-overdue (-> String Bool))
(: task-just-became-overdue (-> String Bool))

;; Define automatic scheduling predicates
(: auto-schedule-trigger (-> String String))
(: can-schedule (-> String Bool))
(: is-overdue (-> String String Bool))
(: calculate-urgency (-> String String Number Number))
(: reschedule-all-tasks (-> String))

;; Rule: Automatic scheduling triggers
;; When a task is created
(= (auto-schedule-trigger "task-created" $task-id)
   (reschedule-all-tasks (get-user-id $task-id)))

;; When a task is updated (priority, deadline, duration, dependency)
(= (auto-schedule-trigger "task-updated" $task-id)
   (reschedule-all-tasks (get-user-id $task-id)))

;; When a task is completed (enables dependent tasks)
(= (auto-schedule-trigger "task-completed" $task-id)
   (reschedule-all-tasks (get-user-id $task-id)))

;; When a task becomes overdue (enables dependent tasks)
(= (auto-schedule-trigger "task-overdue" $task-id)
   (reschedule-all-tasks (get-user-id $task-id)))

;; When a task is deleted
(= (auto-schedule-trigger "task-deleted" $user-id)
   (reschedule-all-tasks $user-id))

;; Rule: Independent tasks can always be scheduled
(= (can-schedule $task-id)
   (independent-task $task-id))

;; Rule: Dependent tasks can be scheduled if immediate dependency is completed OR overdue
;; No recursive checking needed - only validate immediate dependency
;; Overdue dependencies do not block scheduling of dependent tasks
(= (can-schedule $task-id)
   (and (depends-on $task-id $dependency-id)
        (or (task-completed $dependency-id)
            (task-overdue $dependency-id))))

;; Rule: Task is eligible when its direct dependency completes OR becomes overdue
;; Example: Task B depends on Task A
;; Task B becomes schedulable when Task A is completed OR when Task A becomes overdue
;; Task B does not need to check the status of A's dependencies
(= (becomes-eligible $task-id)
   (and (depends-on $task-id $dependency-id)
        (or (task-just-completed $dependency-id)
            (task-just-became-overdue $dependency-id))))

;; Rule: Calculate urgency score based on deadline and priority
;; Higher score = more urgent (for automatic prioritization)
(= (calculate-urgency $deadline $priority $deadline-weight $priority-weight)
   (+ (* (deadline-urgency $deadline) $deadline-weight)
      (* $priority $priority-weight)))

;; Rule: Deadline urgency (days until deadline, inverted)
(= (deadline-urgency $deadline)
   (/ 1 (+ 1 (days-until $deadline))))

;; Automatic scheduling algorithm: Sort by urgency score (highest first)
(: auto-schedule-tasks (-> List List))
(= (auto-schedule-tasks $tasks)
   (sort-by-urgency-automatic $tasks))

;; Helper function to sort tasks by urgency automatically
(= (sort-by-urgency-automatic $tasks)
   (sort $tasks 
         (lambda ($a $b) 
           (> (get-task-urgency-auto $a) 
              (get-task-urgency-auto $b)))))

;; Get task urgency for automatic scheduling
(= (get-task-urgency-auto $task)
   (let* (($deadline (task-deadline $task))
          ($priority (task-priority $task))
          ($deadline-weight (get-default-deadline-weight))
          ($priority-weight (get-default-priority-weight)))
     (calculate-urgency $deadline $priority $deadline-weight $priority-weight)))

;; Default weights for automatic scheduling
(= (get-default-deadline-weight) 0.6)
(= (get-default-priority-weight) 0.4)

;; Task filtering predicates for automatic scheduling
(: auto-schedulable-tasks (-> List List))
(= (auto-schedulable-tasks $tasks)
   (filter (lambda ($task) (can-schedule (task-id $task))) $tasks))

;; Get all independent tasks (priority in automatic scheduling)
(: get-independent-tasks-auto (-> List List))
(= (get-independent-tasks-auto $tasks)
   (filter (lambda ($task) (independent-task (task-id $task))) $tasks))

;; Get all dependent tasks that can now be scheduled (completed or overdue dependencies)
(: get-newly-schedulable-tasks (-> List List))
(= (get-newly-schedulable-tasks $tasks)
   (filter (lambda ($task) 
     (and (depends-on (task-id $task) $dep-id)
          (or (task-completed $dep-id)
              (task-overdue $dep-id)))) $tasks))

;; Automatic time allocation algorithm
(: auto-allocate-time (-> String Number String String))
(= (auto-allocate-time $task-id $duration $current-time)
   (let* (($start-time (find-optimal-slot $task-id $duration $current-time))
          ($end-time (add-hours $start-time $duration)))
     (set-task-schedule $task-id $start-time $end-time)))

;; Conflict detection for automatic scheduling
(: has-time-conflict-auto (-> String String String String Bool))
(= (has-time-conflict-auto $start1 $end1 $start2 $end2)
   (or (and (>= $start1 $start2) (< $start1 $end2))
       (and (>= $start2 $start1) (< $start2 $end1))))

;; Automatic reschedule trigger conditions
(: needs-auto-reschedule (-> String Bool))
(= (needs-auto-reschedule $task-id)
   (or (task-priority-changed $task-id)
       (task-deadline-changed $task-id)
       (task-dependency-changed $task-id)
       (dependency-completed $task-id)
       (dependency-became-overdue $task-id)))

;; Main automatic scheduling function
(: auto-schedule-all-user-tasks (-> String List))
(= (auto-schedule-all-user-tasks $user-id)
   (let* (($user-tasks (get-user-tasks $user-id))
          ($schedulable (auto-schedulable-tasks $user-tasks))
          ($sorted (auto-schedule-tasks $schedulable)))
     (auto-allocate-times $sorted (current-time))))

;; Priority-based automatic rescheduling
;; High priority tasks can bump lower priority tasks
(: priority-based-reschedule (-> String Number))
(= (priority-based-reschedule $new-task-id $new-priority)
   (if (>= $new-priority 4) ;; Urgent or Critical
       (bump-lower-priority-tasks $new-task-id)
       (schedule-in-next-available $new-task-id)))

;; Real-time scheduling optimization
(: optimize-schedule-realtime (-> String))
(= (optimize-schedule-realtime $user-id)
   (let* (($current-schedule (get-current-schedule $user-id))
          ($optimized (minimize-gaps-and-conflicts $current-schedule)))
     (apply-optimized-schedule $optimized)))

;; Dependency chain automatic rescheduling
;; When a task completes OR becomes overdue, immediate dependents become eligible
(: reschedule-immediate-dependents (-> String))
(= (reschedule-immediate-dependents $completed-task-id)
   (let* (($immediate-dependents (get-immediate-dependents $completed-task-id))
          ($newly-eligible (filter-now-schedulable $immediate-dependents)))
     (auto-schedule-tasks $newly-eligible)))

;; Overdue dependency chain rescheduling
;; When a task becomes overdue, schedule its immediate dependents
(: reschedule-dependents-of-overdue (-> String))
(= (reschedule-dependents-of-overdue $overdue-task-id)
   (let* (($immediate-dependents (get-immediate-dependents $overdue-task-id))
          ($newly-eligible (filter-now-schedulable-overdue $immediate-dependents)))
     (auto-schedule-tasks $newly-eligible)))

;; Get only immediate dependents (no recursive lookup)
(: get-immediate-dependents (-> String List))
(= (get-immediate-dependents $task-id)
   (filter (lambda ($task) 
     (= (task-dependency $task) $task-id)) (get-all-tasks)))

;; Filter tasks that are now schedulable due to completed or overdue dependencies
(: filter-now-schedulable (-> List List))
(= (filter-now-schedulable $tasks)
   (filter (lambda ($task)
     (validate-immediate-dependency (task-id $task))) $tasks))

;; Filter tasks that are now schedulable specifically due to overdue dependencies
(: filter-now-schedulable-overdue (-> List List))
(= (filter-now-schedulable-overdue $tasks)
   (filter (lambda ($task)
     (let* (($dep-id (get-immediate-dependency (task-id $task))))
       (and (not (= $dep-id none))
            (task-overdue $dep-id)))) $tasks))

;; Validation rule: A task can only be scheduled if immediate dependency is complete OR overdue
(: validate-immediate-dependency (-> String Bool))
(= (validate-immediate-dependency $task-id)
   (let* (($immediate-dep (get-immediate-dependency $task-id)))
     (if (= $immediate-dep none)
         true  ;; Independent task
         (or (task-completed $immediate-dep)
             (task-overdue $immediate-dep)))))

;; Simple dependency chain example with overdue handling:
;; Task A (independent) -> Task B -> Task C -> Task D
;; When A completes, only B becomes eligible
;; When B completes, only C becomes eligible  
;; When C completes, only D becomes eligible
;; If any task becomes overdue, its immediate dependents become eligible
;; Example: If A becomes overdue, B can still be scheduled
;;          If B becomes overdue, C can still be scheduled
(: example-chain-validation (-> String String String String))
(= (example-chain-validation $task-a $task-b $task-c $task-d)
   (and (independent-task $task-a)
        (depends-on $task-b $task-a)
        (depends-on $task-c $task-b)
        (depends-on $task-d $task-c)))

;; Overdue dependency example:
;; If Task A is overdue and Task B depends on Task A,
;; then Task B should still be schedulable
(: overdue-dependency-example (-> String String Bool))
(= (overdue-dependency-example $task-a $task-b)
   (and (depends-on $task-b $task-a)
        (task-overdue $task-a)
        (can-schedule $task-b)))  ;; This should return true
