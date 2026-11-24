import { redirect } from "next/navigation";

// Chats live at /chat/<id>; a new one starts from the home composer.
export default function ChatIndexPage() {
  redirect("/");
}
