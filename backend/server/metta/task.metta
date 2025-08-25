;;Creating facts-this facts will be created dynamically from db data
;;Structure
;;(Task id  task_description deadline status level_priority dependencies)
;;Tasks = nodes
;;Dependencies = edges
;;Properties = node attributes


# Nodes (Tasks)
(task Task1)
(task Task2)
(task Task3)
(task Task4)
(task Task5)

# Properties (Node attributes)
(priority Task1 High)
(priority Task2 High)
(priority Task3 Medium)
(priority Task4 Low)
(priority Task5 Medium)

(deadline Task1 "2025-08-27")
(deadline Task2 "2025-08-29")
(deadline Task3 "2025-09-01")
(deadline Task4 "2025-09-04")
(deadline Task5 "2025-08-30")

(status Task1 Incomplete)
(status Task2 Incomplete)
(status Task3 Incomplete)
(status Task4 Incomplete)
(status Task5 Incomplete)


(depends Task2 Task1)  ; Task2 depends on Task1
(depends Task3 Task2)  ; Task3 depends on Task2
(depends Task4 Task2)  ; Task4 also depends on Task2
(depends Task5 Task1)  ; Task5 depends on Task1
