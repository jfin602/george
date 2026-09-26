export type QualificationState = 'green' | 'not_green' | 'evidence_gap';

export type BroadObservation = Readonly<{
  identity: string;
  outcome: 'failed' | 'skipped';
  category: string;
  signature: string;
}>;

export type BroadRunSummary = Readonly<{
  state: QualificationState;
  commit: string;
  nodeVersion: string;
  npmVersion: string;
  command: string;
  dependencyIdentity: string;
  environment: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  observations: readonly BroadObservation[];
}>;

export type PreflightClassification = Readonly<{
  hardPreflight: QualificationState;
  aggregateBroad: QualificationState;
  broadRegressionDelta: QualificationState;
  liveEligibility: QualificationState;
  reasons: readonly string[];
  matched: readonly BroadObservation[];
  new: readonly BroadObservation[];
  worsened: readonly BroadObservation[];
}>;

const MAX_OBSERVATIONS = 1_000;
const MAX_IDENTITY = 300;
const MAX_CATEGORY = 80;
const MAX_SIGNATURE = 300;

function evidenceProblem(summary: BroadRunSummary, label: string): string | undefined {
  if (summary.observations.length > MAX_OBSERVATIONS) return `${label} observations exceed the bounded evidence limit.`;
  if (![summary.commit, summary.nodeVersion, summary.npmVersion, summary.command, summary.dependencyIdentity, summary.environment].every((value) => value.length > 0 && value.length <= MAX_IDENTITY)) return `${label} execution provenance is missing or unbounded.`;
  if (![summary.total, summary.passed, summary.failed, summary.skipped].every(Number.isSafeInteger)) return `${label} counts are invalid.`;
  if ([summary.total, summary.passed, summary.failed, summary.skipped].some((count) => count < 0) || summary.total !== summary.passed + summary.failed + summary.skipped) return `${label} counts are inconsistent.`;
  if (summary.failed !== summary.observations.filter(({ outcome }) => outcome === 'failed').length || summary.skipped !== summary.observations.filter(({ outcome }) => outcome === 'skipped').length) return `${label} identities do not account for the failed and skipped counts.`;
  const keys = new Set<string>();
  for (const observation of summary.observations) {
    if (!observation.identity || observation.identity.length > MAX_IDENTITY || !observation.category || observation.category.length > MAX_CATEGORY || !observation.signature || observation.signature.length > MAX_SIGNATURE) return `${label} contains missing or unbounded observation evidence.`;
    const key = observation.identity;
    if (keys.has(key)) return `${label} contains duplicate observation identities.`;
    keys.add(key);
  }
  const observedState = summary.failed > 0 || summary.skipped > 0 ? 'not_green' : 'green';
  if (summary.state !== 'evidence_gap' && summary.state !== observedState) return `${label} aggregate state conflicts with its observations.`;
  return undefined;
}

function observationOrder(left: BroadObservation, right: BroadObservation): number {
  const leftKey = `${left.outcome}\0${left.identity}`;
  const rightKey = `${right.outcome}\0${right.identity}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

export function classifyQualificationPreflight(input: Readonly<{
  hardPreflight: QualificationState;
  baseline: BroadRunSummary;
  candidate: BroadRunSummary;
}>): PreflightClassification {
  const reasons: string[] = [];
  const baselineProblem = evidenceProblem(input.baseline, 'Baseline');
  const candidateProblem = evidenceProblem(input.candidate, 'Candidate');
  const aggregateBroad: QualificationState = candidateProblem ? 'evidence_gap' : input.candidate.state;
  const equivalentExecution = ['nodeVersion', 'npmVersion', 'command', 'dependencyIdentity', 'environment'].every((key) => input.baseline[key as keyof BroadRunSummary] === input.candidate[key as keyof BroadRunSummary]);
  let broadRegressionDelta: QualificationState = 'green';
  const matched: BroadObservation[] = [];
  const newlyObserved: BroadObservation[] = [];
  const worsened: BroadObservation[] = [];

  if (input.baseline.state === 'evidence_gap' || input.candidate.state === 'evidence_gap' || baselineProblem || candidateProblem || !equivalentExecution) {
    broadRegressionDelta = 'evidence_gap';
    reasons.push(baselineProblem ?? candidateProblem ?? (input.baseline.state === 'evidence_gap' ? 'Baseline broad evidence is incomplete.' : input.candidate.state === 'evidence_gap' ? 'Candidate broad evidence is incomplete.' : 'Baseline and candidate execution evidence is not equivalent.'));
  } else {
    const baseline = new Map(input.baseline.observations.map((observation) => [`${observation.outcome}\0${observation.identity}`, observation]));
    for (const observation of input.candidate.observations) {
      const previous = baseline.get(`${observation.outcome}\0${observation.identity}`);
      if (!previous) newlyObserved.push(observation);
      else if (previous.category !== observation.category || previous.signature !== observation.signature) worsened.push(observation);
      else matched.push(observation);
    }
    if (newlyObserved.length > 0 || worsened.length > 0) {
      broadRegressionDelta = 'not_green';
      if (newlyObserved.length > 0) reasons.push('Candidate has new failed or skipped test identities.');
      if (worsened.length > 0) reasons.push('Candidate has materially changed retained failure evidence.');
    } else reasons.push('All candidate failures and skips match materially equivalent baseline evidence.');
  }

  let liveEligibility: QualificationState = broadRegressionDelta;
  if (input.hardPreflight === 'not_green') {
    liveEligibility = 'not_green';
    reasons.push('Hard preflight is Not Green.');
  } else if (input.hardPreflight === 'evidence_gap') {
    liveEligibility = 'evidence_gap';
    reasons.push('Hard preflight has an Evidence Gap.');
  }

  return Object.freeze({
    hardPreflight: input.hardPreflight,
    aggregateBroad,
    broadRegressionDelta,
    liveEligibility,
    reasons: Object.freeze(reasons),
    matched: Object.freeze(matched.sort(observationOrder)),
    new: Object.freeze(newlyObserved.sort(observationOrder)),
    worsened: Object.freeze(worsened.sort(observationOrder)),
  });
}
