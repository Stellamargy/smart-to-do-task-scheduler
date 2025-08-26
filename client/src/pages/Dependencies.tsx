import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/hooks/useTasks";
import { GitBranch, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/ui/priority-badge";
import React, { useState } from "react";
import Masonry from "react-masonry-css";

function findDependencyChains(tasks) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const visited = new Set();
  const chains = [];

  // Find all leaves (tasks not depended on by any other)
  const dependedUpon = new Set();
  tasks.forEach((t) => t.dependencies.forEach((dep) => dependedUpon.add(dep)));
  const leaves = tasks.filter((t) => !tasks.some((other) => other.dependencies.includes(t.id)));

  // For each leaf, walk backwards to the root
  for (const leaf of leaves) {
    let chain = [];
    let current = leaf;
    while (current) {
      chain.unshift(current);
      if (current.dependencies.length === 1) {
        current = taskMap.get(current.dependencies[0]);
      } else {
        // Only follow chains with single dependency, otherwise stop.
        break;
      }
    }
    // Only include chains with more than 1 task (i.e., there is a dependency)
    if (chain.length > 1) {
      // Avoid duplicates: key by last task id
      if (!visited.has(chain[chain.length - 1].id)) {
        chains.push(chain);
        chain.forEach((t) => visited.add(t.id));
      }
    }
  }
  return chains;
}

export default function Dependencies() {
  const { tasks } = useTasks();
  const dependencyChains = findDependencyChains(tasks);
  const chainTaskIds = new Set(dependencyChains.flat().map((t) => t.id));
  const independentTasks = tasks.filter(
    (t) => t.dependencies.length === 0 && !chainTaskIds.has(t.id)
  );

  // Dropdown state for mobile
  const [selectedChain, setSelectedChain] = useState(0);

  const TaskNode = ({
    task,
    isPrerequisite = false,
  }: {
    task: any;
    isPrerequisite?: boolean;
  }) => (
    <div
      className={`
        p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 w-full bg-gradient-to-br
        ${task.status === "completed"
          ? "from-success/10 to-success/5 border-success/30"
          : "from-card to-muted border-border hover:border-primary/50"
        }
        ${isPrerequisite ? "scale-95 opacity-90" : ""}
        shadow-md relative overflow-hidden
      `}
      style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4
          className={`font-semibold truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}
            text-xs xs:text-xs sm:text-sm md:text-base lg:text-base xl:text-lg`}
          title={task.title}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.status === "completed" && (
            <Badge
              variant="outline"
              className="bg-success/10 text-success border-success/20"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">Done</span>
            </Badge>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs xs:text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-[0.7em] xs:text-xs sm:text-xs md:text-sm">
        <span className="text-muted-foreground truncate max-w-[90px] xs:max-w-[120px]" title={task.deadline && `Due: ${new Date(task.deadline).toLocaleDateString()}` || ''}>
          {task.deadline && `Due: ${new Date(task.deadline).toLocaleDateString()}`}
        </span>
        <span
          className={`flex items-center gap-1 ${task.status === "completed" ? "text-success" : "text-muted-foreground"}`}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          Task Dependencies
        </h1>
        <p className="text-muted-foreground mt-2">
          Visualize how your tasks depend on each other
        </p>
      </div>

      {/* Dependency Chains */}
      {dependencyChains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg xs:text-lg sm:text-xl md:text-2xl">Dependency Chains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mobile/Small Screen: Dropdown & Show One Chain */}
            <div className="block sm:hidden">
              <label htmlFor="chainSelect" className="block mb-2 text-xs xs:text-xs sm:text-sm font-medium text-muted-foreground">
                Select Dependency Chain
              </label>
              <select
                id="chainSelect"
                className="border rounded px-3 py-2 w-full mb-6 text-xs xs:text-xs sm:text-sm truncate"
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
              >
                {dependencyChains.map((chain, idx) => (
                  <option key={chain.map((t) => t.id).join("-")} value={idx} className="truncate">
                    Chain {idx + 1}: {chain.map(t => t.title).join(" → ").length > 40 ? chain.map(t => t.title).join(" → ").slice(0, 40) + "..." : chain.map(t => t.title).join(" → ")}
                  </option>
                ))}
              </select>
              {/* Chain: Vertical arrangement */}
              <div className="flex flex-col items-center gap-3">
                {dependencyChains[selectedChain].map((task, idx, arr) => (
                  <React.Fragment key={task.id}>
                    <TaskNode
                      task={task}
                      isPrerequisite={idx < arr.length - 1}
                    />
                    {idx < arr.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-primary rotate-90" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              {/* Progress indicator */}
              <div className="flex items-center gap-2 text-xs mt-3">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-success transition-all duration-300"
                    style={{
                      width:
                        ((dependencyChains[selectedChain].filter((p) => p.status === "completed").length /
                          dependencyChains[selectedChain].length) *
                          100) +
                        "%",
                    }}
                  />
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {dependencyChains[selectedChain].filter((p) => p.status === "completed").length} / {dependencyChains[selectedChain].length} tasks completed
                </span>
              </div>
            </div>

            {/* Tablet/Desktop: Show all chains in masonry columns */}
            <div
              className="hidden sm:block"
              style={{ width: '100%', overflowX: 'hidden' }} // prevent overflow
            >
              <Masonry
                breakpointCols={{
                  default: 3,
                  1200: 2,
                  800: 1,
                }}
                className="masonry-grid"
                columnClassName="masonry-column"
              >
                {dependencyChains.map((chain, index) => (
                  <div
                    key={chain.map((t) => t.id).join("-")}
                    className="mb-8 flex flex-col w-full"
                  >
                    <div className="text-xs xs:text-xs sm:text-sm font-medium text-muted-foreground mb-2 truncate">
                      Chain {index + 1}: {chain.map(t => t.title).join(" → ").length > 60 ? chain.map(t => t.title).join(" → ").slice(0, 60) + "..." : chain.map(t => t.title).join(" → ")}
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr', minWidth: 0 }}>
                      {chain.map((task, idx) => (
                        <React.Fragment key={task.id}>
                          <TaskNode
                            task={task}
                            isPrerequisite={idx < chain.length - 1}
                          />
                          {idx < chain.length - 1 && (
                            <div className="flex justify-center my-1">
                              <ArrowRight className="h-5 w-5 text-primary rotate-90" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center gap-2 text-xs mt-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-success transition-all duration-300"
                          style={{
                            width:
                              ((chain.filter((p) => p.status === "completed").length /
                                chain.length) *
                                100) +
                              "%",
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {chain.filter((p) => p.status === "completed").length} / {chain.length} tasks completed
                      </span>
                    </div>
                  </div>
                ))}
              </Masonry>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Independent Tasks */}
      {independentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Independent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {independentTasks.map((task) => (
                <TaskNode key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {dependencyChains.length === 0 && independentTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground">
              Create some tasks to see their dependency relationships here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}