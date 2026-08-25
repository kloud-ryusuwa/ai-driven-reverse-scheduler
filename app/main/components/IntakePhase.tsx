import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

type IntakePhaseProps = {
  onNext: (task: string, date: string) => void;
  initialTaskName?: string;
  initialDeadline?: string;
};

export default function IntakePhase({
  onNext,
  initialTaskName = "",
  initialDeadline = "",
}: IntakePhaseProps) {
  const [taskName, setTaskName] = useState(initialTaskName);
  const [deadline, setDeadline] = useState(initialDeadline);

  useEffect(() => {
    // クエリパラメータ等の初期値が変わったらフォームを同期する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTaskName(initialTaskName);
    setDeadline(initialDeadline);
  }, [initialTaskName, initialDeadline]);

  const handleSubmit = () => {
    if (!taskName.trim() || !deadline) return;
    onNext(taskName.trim(), deadline);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Card component="section">
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, "&:last-child": { pb: { xs: 2.5, md: 3.5 } } }}>
      <Typography variant="overline" color="primary" fontWeight={800}>START FROM THE DEADLINE</Typography>
      <Typography variant="h2" sx={{ mb: .5 }}>ゴールから逆算して、今日の一歩を決める</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>目標と絶対期日だけで、AIが余裕を含む実行計画を組み立てます。</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField
          fullWidth
          label="達成したいゴール"
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例：金曜のデモを完成させる"
        />
        <TextField
          label="絶対期日"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeRoundedIcon />}
          onClick={handleSubmit}
          disabled={!taskName.trim() || !deadline}
          sx={{ px: 3, whiteSpace: "nowrap" }}
        >
          逆算プランを作る
        </Button>
      </Stack>
      <Box sx={{ mt: 2, color: "text.secondary", fontSize: 12 }}>20%の安全係数を含めて見積もります。作成後に内容を確認できます。</Box>
      </CardContent>
    </Card>
  );
}
