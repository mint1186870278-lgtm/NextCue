import { redirect } from "next/navigation";

/**
 * 根路径 / 服务端重定向到 /try
 */
export default function Home() {
  redirect("/try");
}
