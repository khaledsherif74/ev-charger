import { useEffect } from "react";

/** Browser tab title. Each app has its own: "VoltCharge" for customers, "VoltCharge Admin" for the owner. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
