(task_1 1  high  none  inProgress make 300)
(task_2 2  high  1  inProgress make 3000)
(task_3 3  low  none  inProgress yes 200)
(task_4 4  medium  none  completed make 500)
(task_5 5  medium  3  inProgress imagine 4000)



      (=(getTask $task) (match &self ($task $id $priority $dependsOn $status $description $timeout)
        ($task $id $priority $dependsOn $status $description $timeout) 
       ))

       
        (=(getTaskId $task) (match &self ($task $id $priority $dependsOn $status $description $timeout)
            $id 
         ))

        (=(getTaskPriority $task) (match &self ($task $id $priority $dependsOn $status $description $timeout)
            $priority 
         ))

        (=(getTaskDependsOn $task) (match &self ($task $id $priority $dependsOn $status $description $timeout)
            $dependsOn 
         ))
        (=(getTaskStatus $task) (match &self ($task $id $priority $dependsOn $status $description $timeout)
            $status 
         ))
        (=(getTaskDescription $task) (match &self ($task $id $priority $dependsOn $status $description  $timeout)
            $description 
         ))
        (=(getTaskTimeout $task) (match &self ($task $id $priority $dependsOn $status $description  $timeout)
            $timeout 
         ))
         
         !(getTask task_1)

        !(getTaskId task_1) ; returns 1
        !(getTaskPriority task_1) ; returns high
        !(getTaskDependsOn task_1) ; returns none
        !(getTaskStatus task_1) ; returns build
        !(getTaskDescription  task_1) ; returns make
        !(getTaskTimeout task_1) ; returns 300

        ;(=(scheduleTasks ) (if))



        (=(updateTaskStatus $task $status) 
        (if (=$status completed)
            (match &self ($task $id $priority $dependsOn $oldStatus $description $timeout)
                ($task $id $priority $dependsOn completed $description $timeout)
            )
            $task 
                                   
    ))


    ;Add new task
    (=(AddTask $task) (add-atom &self $task) 
    
    

)
!(AddTask (task_6 6  low  none  inProgress code 600))
!(getTask task_6)

