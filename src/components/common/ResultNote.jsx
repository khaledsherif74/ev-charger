import { useI18n } from "../../i18n";
import { entryFor } from "../../utils/errorCatalog";
import { HelpLink } from "./HelpPanel";

/** Result of an action in plain words. note = { tone: ok|warn|bad, text, code, detail } */
export default function ResultNote({ note, ctx }) {
  const { lang } = useI18n();
  if (!note) return null;
  const detail = note.code ? entryFor(note.code, lang).meaning : note.detail;
  return (
    <div className={`note note-${note.tone}`}>
      <div>{note.text}</div>
      {detail ? <div className="note-detail">{detail}</div> : null}
      {note.code ? <HelpLink code={note.code} ctx={ctx} /> : null}
    </div>
  );
}
