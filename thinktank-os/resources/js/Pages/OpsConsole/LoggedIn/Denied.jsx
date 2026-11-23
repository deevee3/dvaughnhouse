import { TressShell } from '../../../TressColumn/components/TressShell';

export default function Denied() {
    return (
        <TressShell surface="ops" title="Console" active="console">
            <div className="tc-empty">
                <p className="tc-empty-title">Staff only.</p>
                <p className="tc-empty-body">
                    The ops console is for staff. This account is not on the staff list.
                    No staff data is shown.
                </p>
            </div>
        </TressShell>
    );
}
