;; -------------------------
;; Comprehensive Test Data - Demonstrates Dependencies, Deadlines, and Priorities
;; -------------------------

;; Foundation tasks (completed - won't appear in schedule)
(Task 1)
(Title 1 "Setup environment")
(Deadline 1 20250815)
(Status 1 "completed")
(Priority 1 1)

(Task 2)
(Title 2 "Install dependencies") 
(Deadline 2 20250816)
(Status 2 "completed")
(Priority 2 2)

;; Layer 1: Independent tasks with different deadlines and priorities
(Task 3)
(Title 3 "Write documentation")
(Deadline 3 20250820)
(Status 3 "incomplete")
(Priority 3 2)

(Task 4)
(Title 4 "Create unit tests")
(Deadline 4 20250820)  ; Same deadline as Task 3
(Status 4 "incomplete")
(Priority 4 1)         ; Higher priority than Task 3

(Task 5)
(Title 5 "Design UI mockups")
(Deadline 5 20250819)  ; Earlier deadline
(Status 5 "incomplete")
(Priority 5 3)         ; Lower priority

;; Layer 2: Tasks depending on Layer 1
(Task 6)
(Title 6 "Implement core features")
(Deadline 6 20250825)
(Status 6 "incomplete")
(Priority 6 1)

(Task 7)
(Title 7 "Code review")
(Deadline 7 20250825)  ; Same deadline as Task 6
(Status 7 "incomplete")
(Priority 7 2)         ; Lower priority than Task 6

;; Layer 3: Final tasks with complex dependencies
(Task 8)
(Title 8 "Integration testing")
(Deadline 8 20250830)
(Status 8 "incomplete")
(Priority 8 1)

(Task 9)
(Title 9 "Performance optimization")
(Deadline 9 20250828)  ; Earlier deadline than Task 8
(Status 9 "incomplete")
(Priority 9 2)

(Task 10)
(Title 10 "Security audit")
(Deadline 10 20250828) ; Same deadline as Task 9
(Status 10 "incomplete")
(Priority 10 1)        ; Higher priority than Task 9

;; Final deployment task
(Task 11)
(Title 11 "Deploy to production")
(Deadline 11 20250901)
(Status 11 "incomplete")
(Priority 11 1)

;; Dependencies - Creates a clear hierarchy
;; Layer 1 depends on completed foundation
(DependsOn 3 1)  ; Documentation depends on setup
(DependsOn 4 1)  ; Unit tests depend on setup  
(DependsOn 5 2)  ; UI mockups depend on install

;; Layer 2 depends on Layer 1
(DependsOn 6 3)  ; Core features depend on documentation
(DependsOn 6 4)  ; Core features depend on unit tests
(DependsOn 7 5)  ; Code review depends on UI mockups

;; Layer 3 depends on Layer 2
(DependsOn 8 6)  ; Integration testing depends on core features
(DependsOn 9 6)  ; Performance optimization depends on core features
(DependsOn 10 7) ; Security audit depends on code review

;; Final deployment depends on everything critical
(DependsOn 11 8) ; Deploy depends on integration testing
(DependsOn 11 10); Deploy depends on security audit

;; -------------------------
;; Expected Scheduling Logic Analysis
;; -------------------------

;; TODAY: 20250818

;; LAYER 1 (All ready - no incomplete dependencies):
;; - Task 5: Deadline 20250819, Priority 3 → Scheduled FIRST (earliest deadline)
;; - Task 4: Deadline 20250820, Priority 1 → Scheduled SECOND (same deadline as 3, higher priority) 
;; - Task 3: Deadline 20250820, Priority 2 → Scheduled THIRD (same deadline as 4, lower priority)

;; LAYER 2 (Ready after Layer 1 completes):
;; - Task 6: Deadline 20250825, Priority 1 → Scheduled FOURTH (depends on 3&4, higher priority than 7)
;; - Task 7: Deadline 20250825, Priority 2 → Scheduled FIFTH (depends on 5, lower priority than 6)

;; LAYER 3 (Ready after Layer 2 completes):
;; - Task 10: Deadline 20250828, Priority 1 → Scheduled SIXTH (depends on 7, earlier deadline than 8, higher priority than 9)
;; - Task 9:  Deadline 20250828, Priority 2 → Scheduled SEVENTH (depends on 6, same deadline as 10, lower priority)
;; - Task 8:  Deadline 20250830, Priority 1 → Scheduled EIGHTH (depends on 6, later deadline)

;; FINAL LAYER:
;; - Task 11: Deadline 20250901, Priority 1 → Scheduled NINTH (depends on 8&10)

;; EXPECTED OUTPUT: (5 4 3 6 7 10 9 8 11)

;; -------------------------
;; List utility functions (same as before)
;; -------------------------

;; append two lists
(= (append $a $b)
    (if (== $a ())
        $b
        (let* (
                ($first (car-atom $a))
                ($rest (cdr-atom $a))
                ($appended-rest (append $rest $b))
              )
            (cons-atom $first $appended-rest)
        )
    )
)

;; size of a list
(= (size-atom $list)
    (if (== $list ())
        0
        (let* (
                ($rest (cdr-atom $list))
                ($rest-size (size-atom $rest))
              )
            (+ 1 $rest-size)
        )
    )
)

;; check if element is in list
(= (member $x $list)
    (if (== $list ())
        False
        (let* (
                ($first (car-atom $list))
                ($rest (cdr-atom $list))
              )
            (if (== $x $first)
                True
                (member $x $rest)
            )
        )
    )
)

;; intersection of two lists
(= (intersection-atom $a $b)
    (if (== $a ())
        ()
        (let* (
                ($first (car-atom $a))
                ($rest (cdr-atom $a))
                ($intersection-rest (intersection-atom $rest $b))
              )
            (if (member $first $b)
                (cons-atom $first $intersection-rest)
                $intersection-rest
            )
        )
    )
)

;; remove elements of $b from $a (set subtraction)
(= (subtraction-atom $a $b)
    (if (== $a ())
        ()
        (let* (
                ($first (car-atom $a))
                ($rest (cdr-atom $a))
                ($subtraction-rest (subtraction-atom $rest $b))
              )
            (if (member $first $b)
                $subtraction-rest
                (cons-atom $first $subtraction-rest)
            )
        )
    )
)

;; -------------------------
;; Helper functions
;; -------------------------

;; A task is valid if deadline > today and status == incomplete
(= (is-task-valid $id $today)
    (let* (
            ($deadline (match &self (Deadline $id $d) $d))
            ($status   (match &self (Status $id $s) $s))
          )
        (if (> $deadline $today)
            (if (== $status "incomplete")
                True
                False
            )
            False
        )
    )
)

;; Get all task IDs
(= (get-all-tasks-id)
    (collapse (unique (match &self (Task $id) $id)))
)

;; Filter valid tasks
(= (get-valid-tasks $tasks $today)
    (if (== $tasks ())
        ()
        (let* (
                ($first (car-atom $tasks))
                ($rest (cdr-atom $tasks))
                ($valid-rest (get-valid-tasks $rest $today))
              )
            (if (is-task-valid $first $today)
                (cons-atom $first $valid-rest)
                $valid-rest
            )
        )
    )
)

(= (valid-tasks $today)
    (get-valid-tasks (get-all-tasks-id) $today)
)

;; -------------------------
;; Dependency helpers
;; -------------------------

;; Direct prerequisites of a task
(= (prerequisites $task)
    (collapse (unique (match &self (DependsOn $task $pr) $pr)))
)

;; -------------------------
;; Deadline and Priority utilities
;; -------------------------

;; Get deadline for a task
(= (deadline-of $id)
    (match &self (Deadline $id $d) $d)
)

;; Get priority for a task
(= (priority-of $id)
    (match &self (Priority $id $p) $p)
)

;; Compare two tasks: returns True if task1 should come before task2
;; Priority: 1. Earliest deadline 2. Highest priority (lower number = higher priority)
(= (task-comes-before $task1 $task2)
    (let* (
            ($deadline1 (deadline-of $task1))
            ($deadline2 (deadline-of $task2))
            ($priority1 (priority-of $task1))
            ($priority2 (priority-of $task2))
          )
        (if (< $deadline1 $deadline2)
            True
            (if (> $deadline1 $deadline2)
                False
                ;; Deadlines are equal, use priority (lower number = higher priority)
                (< $priority1 $priority2)
            )
        )
    )
)

;; Find highest priority task from a list (considering both deadline and priority)
(= (highest-priority-task $tasks)
    (if (== $tasks ())
        ()
        (if (== (size-atom $tasks) 1)
            (car-atom $tasks)
            (let* (
                    ($first (car-atom $tasks))
                    ($rest (cdr-atom $tasks))
                    ($best-rest (highest-priority-task $rest))
                  )
                (if (task-comes-before $first $best-rest)
                    $first
                    $best-rest
                )
            )
        )
    )
)

;; Remove a specific task from list
(= (remove-task $tasks $task)
    (if (== $tasks ())
        ()
        (let* (
                ($first (car-atom $tasks))
                ($rest (cdr-atom $tasks))
                ($removed-rest (remove-task $rest $task))
              )
            (if (== $first $task)
                $removed-rest
                (cons-atom $first $removed-rest)
            )
        )
    )
)

;; Sort tasks by deadline first, then priority (optimal ordering)
(= (sort-by-deadline-priority $tasks)
    (if (== $tasks ())
        ()
        (let* (
                ($best (highest-priority-task $tasks))
                ($remaining (remove-task $tasks $best))
                ($sorted-rest (sort-by-deadline-priority $remaining))
              )
            (cons-atom $best $sorted-rest)
        )
    )
)

;; -------------------------
;; BFS scheduling with deadline and priority optimization
;; -------------------------

;; Collect ready tasks (tasks with no unmet prerequisites)
(= (get-ready $unscheduled)
    (if (== $unscheduled ())
        ()
        (let* (
                ($first (car-atom $unscheduled))
                ($rest (cdr-atom $unscheduled))
                ($ready-rest (get-ready $rest))
                ($prereqs (prerequisites $first))
                ($unmet (intersection-atom $prereqs $unscheduled))
              )
            (if (== (size-atom $unmet) 0)
                (cons-atom $first $ready-rest)
                $ready-rest
            )
        )
    )
)

;; BFS loop: keep moving ready tasks to scheduled, prioritized by deadline then priority
(= (bfs-loop $unscheduled $scheduled $today)
    (if (== $unscheduled ())
        $scheduled
        (let* (
                ($ready (get-ready $unscheduled))
                ($ready-sorted (sort-by-deadline-priority $ready))
                ($unscheduled2 (subtraction-atom $unscheduled $ready))
                ($scheduled2 (append $scheduled $ready-sorted))
              )
            (if (== (size-atom $ready) 0)
                ;; No progress possible (cycle or error)
                (append $scheduled $unscheduled)
                (bfs-loop $unscheduled2 $scheduled2 $today)
            )
        )
    )
)

(= (bfs-sort $today)
    (bfs-loop (valid-tasks $today) () $today)
)

;; -------------------------
;; Test Cases
;; -------------------------

;; Test the comprehensive scheduler
!(bfs-sort 20250818)

;; Expected output: (5 4 3 6 7 10 9 8 11)
;; This demonstrates:
;; 1. Dependencies respected (layer-by-layer scheduling)
;; 2. Deadlines prioritized (Task 5 first due to earliest deadline)
;; 3. Priorities break deadline ties (Task 4 before Task 3, Task 10 before Task 9)