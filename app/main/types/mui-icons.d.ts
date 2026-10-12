// 回避策: @mui/icons-material の package.json が欠落している環境で
// 各アイコンコンポーネントの型を解決するためのフォールバック宣言。
// 本来は @mui/icons-material の再インストールで解決すべきである。
declare module "@mui/icons-material/*" {
  import SvgIcon from "@mui/material/SvgIcon";
  export default SvgIcon;
}
