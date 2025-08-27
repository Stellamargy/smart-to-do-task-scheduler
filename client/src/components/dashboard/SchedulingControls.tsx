import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Settings,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { ScheduleWeights } from "@/types/task";

interface SchedulingControlsProps {
  onScheduleAll: (weights?: ScheduleWeights) => void;
  onRescheduleTask?: (taskId: string) => void;
  loading?: boolean;
  scheduledTasksCount?: number;
  pendingTasksCount?: number;
}

export default function SchedulingControls({
  onScheduleAll,
  loading = false,
  scheduledTasksCount = 0,
  pendingTasksCount = 0,
}: SchedulingControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deadlineWeight, setDeadlineWeight] = useState(0.6);
  const [priorityWeight, setPriorityWeight] = useState(0.4);

  const handleQuickSchedule = () => {
    onScheduleAll();
  };

  const handleAdvancedSchedule = () => {
    const weights: ScheduleWeights = {
      deadline_weight: deadlineWeight,
      priority_weight: priorityWeight,
    };
    onScheduleAll(weights);
    setDialogOpen(false);
  };

  // Ensure weights always sum to 1
  const handleDeadlineWeightChange = (values: number[]) => {
    const newDeadlineWeight = values[0];
    setDeadlineWeight(newDeadlineWeight);
    setPriorityWeight(1 - newDeadlineWeight);
  };

  const handlePriorityWeightChange = (values: number[]) => {
    const newPriorityWeight = values[0];
    setPriorityWeight(newPriorityWeight);
    setDeadlineWeight(1 - newPriorityWeight);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Task Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Scheduled</span>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {scheduledTasksCount}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingTasksCount}
            </Badge>
          </div>
        </div>

        {/* Scheduling Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleQuickSchedule}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            {loading ? "Scheduling..." : "Quick Schedule All Tasks"}
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Scheduling
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Advanced Scheduling Options</DialogTitle>
                <DialogDescription>
                  Adjust the weights to customize how tasks are prioritized during scheduling.
                  Weights must sum to 1.0.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deadline-weight" className="text-sm font-medium">
                      Deadline Weight
                    </Label>
                    <Badge variant="outline">{deadlineWeight.toFixed(2)}</Badge>
                  </div>
                  <Slider
                    id="deadline-weight"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[deadlineWeight]}
                    onValueChange={handleDeadlineWeightChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values prioritize tasks with closer deadlines
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priority-weight" className="text-sm font-medium">
                      Priority Weight
                    </Label>
                    <Badge variant="outline">{priorityWeight.toFixed(2)}</Badge>
                  </div>
                  <Slider
                    id="priority-weight"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[priorityWeight]}
                    onValueChange={handlePriorityWeightChange}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values prioritize tasks with higher priority levels
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Scheduling Algorithm</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tasks are scheduled using a weighted scoring system that considers deadlines, 
                    priority levels, and task dependencies. The algorithm ensures dependent tasks 
                    are scheduled after their prerequisites.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAdvancedSchedule} disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Tasks"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scheduling Tips */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Scheduling Tips</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Tasks with dependencies are automatically scheduled after prerequisites</li>
                <li>• Higher priority tasks are scheduled earlier when possible</li>
                <li>• Deadline proximity affects scheduling order</li>
                <li>• Reschedule automatically when completing dependent tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
