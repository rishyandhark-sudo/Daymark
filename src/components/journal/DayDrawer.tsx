import { useAuth } from '../../context/AuthContext';
import { useJournal } from '../../context/JournalContext';
import { prettyDate } from '../../utils/date';
import { Drawer } from '../common/Drawer';
import { ComparisonView } from './ComparisonView';
import { SectionPanel } from './SectionPanel';

export function DayDrawer() {
  const { user, profile } = useAuth();
  const {
    isDrawerOpen,
    selectedDate,
    closeEditor,
    targetByDate,
    happenedByDate,
    serverTodayKey,
    permissionsFor,
    saveTargetRecord,
    saveHappenedRecord,
    deleteDaySection,
  } = useJournal();

  if (!isDrawerOpen || !selectedDate) return null;

  const target = targetByDate.get(selectedDate) ?? null;
  const happened = happenedByDate.get(selectedDate) ?? null;
  const uid = user?.uid ?? 'local';

  // If HAPPENED has no record yet, the day's timezone is frozen by its TARGET (if any).
  const targetEditable = permissionsFor(selectedDate, target).target;
  const happenedEditable = permissionsFor(selectedDate, happened ?? target).happened;
  const targetActivities = target?.activities ?? [];

  return (
    <Drawer
      open={isDrawerOpen}
      onClose={closeEditor}
      title={prettyDate(selectedDate)}
      description={`${selectedDate === serverTodayKey ? 'Today · ' : ''}${profile.timeZone}`}
    >
      <div className="space-y-5">
        <SectionPanel
          kind="target"
          date={selectedDate}
          uid={uid}
          timeZone={profile.timeZone}
          record={target}
          editable={targetEditable}
          onSave={(payload) => saveTargetRecord(selectedDate, payload)}
          onDelete={() => deleteDaySection(selectedDate, 'target')}
        />

        <SectionPanel
          kind="happened"
          date={selectedDate}
          uid={uid}
          timeZone={profile.timeZone}
          record={happened}
          editable={happenedEditable}
          targetActivities={targetActivities}
          onSave={(payload) => saveHappenedRecord(selectedDate, payload)}
          onDelete={() => deleteDaySection(selectedDate, 'happened')}
        />

        {target && happened && <ComparisonView target={target} happened={happened} />}
      </div>
    </Drawer>
  );
}
