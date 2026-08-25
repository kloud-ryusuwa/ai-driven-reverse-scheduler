import { Alert, Box, Button, Card, CardContent, Chip, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";

type ProposalData = {
  title: string;
  totalEstimatedHours: number;
  bufferHours: number;
  effectiveTotalHours: number;
  subtasks: { title: string; estimatedHours: number }[];
};

export default function PlanningPhase({ 
  proposal, 
  onApprove, 
  onReject 
}: { 
  proposal: ProposalData; 
  onApprove: () => void; 
  onReject: () => void; 
}) {
  return (
    <Card component="section"><CardContent sx={{ p: { xs: 2.5, md: 3.5 }, "&:last-child": { pb: { xs: 2.5, md: 3.5 } } }}>
      <Alert severity="success" sx={{ mb: 3 }}>AIが期日から逆算した計画を作成しました。開始前にタスクと工数を確認してください。</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
        <Box><Typography variant="overline" color="primary" fontWeight={800}>PLAN REVIEW</Typography><Typography variant="h2">{proposal.title}</Typography><Typography variant="body2" color="text.secondary">20%の安全係数を含む実行プランです。</Typography></Box>
        <Stack direction="row" spacing={1}><Chip label={`見積 ${proposal.totalEstimatedHours}h`} variant="outlined" /><Chip label={`安全係数込み ${proposal.effectiveTotalHours}h`} color="primary" /></Stack>
      </Stack>
      <List sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", mb: 3 }} disablePadding>
        {proposal.subtasks.map((sub, index) => (
          <ListItem key={index} divider={index < proposal.subtasks.length - 1}><Chip label={index + 1} size="small" sx={{ mr: 2 }} /><ListItemText primary={sub.title} slotProps={{ primary: { fontWeight: 650 } }} /><Typography variant="body2" color="text.secondary">{sub.estimatedHours}h</Typography></ListItem>
        ))}
      </List>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><Button onClick={onApprove} variant="contained" size="large" startIcon={<CheckRoundedIcon />} sx={{ flex: 1 }}>この計画で開始する</Button><Button onClick={onReject} variant="outlined" size="large" startIcon={<ReplayRoundedIcon />}>入力を見直す</Button></Stack>
    </CardContent></Card>
  );
}
