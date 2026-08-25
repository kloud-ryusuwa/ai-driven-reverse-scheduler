"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Fab, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function DemoControls() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/demo-settings").then((res) => res.json()).then((data) => {
      setNow(data.now ? String(data.now).slice(0, 16) : "");
      setModel(data.model ?? "");
      setModels(data.models ?? []);
    }).catch(() => setMessage("設定を取得できませんでした"));
  }, [open]);

  const save = async () => {
    const res = await fetch("/api/demo-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now: now ? new Date(now).toISOString() : null, model }) });
    if (!res.ok) return setMessage("保存できませんでした");
    setMessage("反映しました");
    setTimeout(() => window.location.reload(), 350);
  };

  return <>
    {open && <Paper elevation={8} sx={{ position: "fixed", right: 24, bottom: 92, zIndex: 1400, width: { xs: "calc(100vw - 32px)", sm: 340 }, p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Box><Typography fontWeight={800}>デモ設定</Typography><Typography variant="caption" color="text.secondary">このサーバー全体に反映されます</Typography></Box><Button size="small" onClick={() => setOpen(false)}><CloseRoundedIcon /></Button></Stack>
      <Stack spacing={2}>
        {message && <Alert severity={message === "反映しました" ? "success" : "error"}>{message}</Alert>}
        <TextField label="現在日時" type="datetime-local" value={now} onChange={(event) => setNow(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} helperText="空欄にすると実際の現在日時を使用" />
        <TextField select label="AIモデル" value={model} onChange={(event) => setModel(event.target.value)} slotProps={{ select: { MenuProps: { disablePortal: true } } }}>{models.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
        <Button variant="contained" onClick={save} disabled={!model}>適用</Button>
      </Stack>
    </Paper>}
    <Tooltip title="デモ設定"><Fab color="secondary" onClick={() => setOpen((value) => !value)} sx={{ position: "fixed", right: 24, bottom: 24, zIndex: 1400 }} aria-label="デモ設定を開く"><ScienceRoundedIcon /></Fab></Tooltip>
  </>;
}
