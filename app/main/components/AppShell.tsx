"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppBar, Box, Button, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar, Typography } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import type { ProjectSummary, TaskStatus } from "@/lib/types";
import DemoControls from "@/components/DemoControls";
import NewProjectDialog from "@/components/NewProjectDialog";

const drawerWidth = 264;
const order: Record<TaskStatus, number> = { red: 0, yellow: 1, green: 2 };
const meta = {
  red: { label: "危機", color: "error" as const },
  yellow: { label: "要注意", color: "warning" as const },
  green: { label: "順調", color: "success" as const },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setProjects(data?.projects ?? []))
      .catch(() => undefined);
  }, [pathname]);

  const sorted = useMemo(() => [...projects].sort((a, b) => {
    const statusDiff = order[a.status] - order[b.status];
    return statusDiff || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  }), [projects]);

  const navigation = (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ p: 2.5 }}><Typography fontWeight={850} letterSpacing="-.03em">Reverse Scheduler</Typography></Box>
      <Box sx={{ px: 1.5 }}>
        <ListItemButton component={Link} href="/" selected={pathname === "/"} onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}><DashboardRoundedIcon sx={{ mr: 1.5, fontSize: 20 }} /><ListItemText primary="ダッシュボード" slotProps={{ primary: { fontWeight: 700, fontSize: 14 } }} /></ListItemButton>
        <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setOpen(false); setNewProjectOpen(true); }} sx={{ mt: 1.5 }}>新規プロジェクト</Button>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ px: 2.5, mb: .75 }}>プロジェクト</Typography>
      <List sx={{ px: 1.5, py: 0, overflowY: "auto" }}>
        {sorted.map((project) => (
          <ListItemButton key={project.id} component={Link} href={`/projects/${project.id}`} selected={pathname === `/projects/${project.id}`} onClick={() => setOpen(false)} sx={{ borderRadius: 2, mb: .5, py: 1 }}>
            <ListItemText primary={project.title} secondary={`期日 ${project.deadline}`} slotProps={{ primary: { noWrap: true, fontWeight: 650, fontSize: 14 }, secondary: { fontSize: 11 } }} />
            <Chip label={meta[project.status].label} color={meta[project.status].color} size="small" sx={{ ml: 1, height: 22, fontSize: 10 }} />
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ display: { xs: "block", md: "none" }, borderBottom: "1px solid", borderColor: "divider" }}><Toolbar><IconButton edge="start" onClick={() => setOpen(true)} aria-label="メニューを開く"><MenuRoundedIcon /></IconButton><Typography fontWeight={800} sx={{ ml: 1 }}>Reverse Scheduler</Typography></Toolbar></AppBar>
      <Drawer variant="permanent" open slotProps={{ paper: { sx: { display: { xs: "none", md: "block" }, width: drawerWidth, borderRightColor: "divider" } } }} sx={{ display: { xs: "none", md: "block" } }}>{navigation}</Drawer>
      <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: drawerWidth, borderRightColor: "divider" } } }} sx={{ display: { xs: "block", md: "none" } }}>{navigation}</Drawer>
      <Box sx={{ ml: { xs: 0, md: `${drawerWidth}px` } }}>{children}</Box>
      <DemoControls />
      <NewProjectDialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </Box>
  );
}
