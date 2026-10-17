import { useI18n } from "../../i18n";
import { entryFor } from "../../utils/errorCatalog";
import { HelpLink } from "./HelpPanel";

export default function ResultNote({ note, ctx }) {
  const { lang, t } = useI18n();
  if (!note) return null;
  const detail = note.code ? entryFor(note.code, lang).meaning : note.detail;
  return (
    <div className={`note note-${note.tone}`}>
      <div>{note.text}</div>
      {detail ? <div className="note-detail">{detail}</div> : null}
      {note.ms != null ? (
        <div className="note-time">
          {t("res.time", {
            t:
              note.ms < 1000
                ? `${note.ms} ms`
                : `${(note.ms / 1000).toFixed(1)} s`,
          })}
        </div>
      ) : null}
      {note.code ? <HelpLink code={note.code} ctx={ctx} /> : null}
    </div>
  );
}
