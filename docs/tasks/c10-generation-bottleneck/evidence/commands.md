# Correction 10 P4 evidence commands

The exact focused and required validation commands are recorded in the qualification report. Additional identity, environment, provider, and metric commands were:

```text
git status --short
git rev-parse HEAD
git rev-parse HEAD^{tree}
node -p "require('./package.json').version"
test ! -e package-lock.json
fnm exec --using=26.10.0 node --version
fnm exec --using=26.10.0 npm --version
uname -a
node --input-type=module -e "import { resolveGeorgeConfig } from './src/core/config.ts'; const c=resolveGeorgeConfig(); console.log(JSON.stringify({context:c.context,executionPolicy:c.executionPolicy,provider:{origin:c.provider.baseUrl.origin,model:c.provider.model,timeoutMs:c.provider.timeoutMs}},null,2))"
curl --silent --show-error --max-time 5 --write-out '\nhttp_status=%{http_code}\n' http://127.0.0.1:1234/v1/models
curl --silent --show-error --max-time 5 --write-out '\nhttp_status=%{http_code}\n' http://127.0.0.1:1234/api/v0/models
tr '\0' '\n' </proc/2814/cmdline | rg '^--annotation=_version='
readlink /proc/4528/exe
```

The deterministic transmission calculation used the P3 representative fixture values and the same canonical `apply_patch` JSON expansion:

```text
fnm exec --using=26.10.0 node --input-type=module -e 'import {createHash} from "node:crypto"; const hash=s=>createHash("sha256").update(s).digest("hex"); const payload=v=>`${Buffer.byteLength(v)}\n${v}\n`; const edit=(r,rs)=>`E ${r} ${rs.length}\n${rs.map(([a,b,v])=>`R ${a} ${b} ${payload(v)}`).join("")}`; const packet=(...ops)=>`GEP/1\n${ops.join("")}END\n`; const a="one\ntwo\nthree\nfour\n", b="alpha\nbeta\n"; const an="ONE\ntwo\nTHREE\nFOUR\n", bn="alpha\nBETA\n"; const e1=edit("R1",[[1,1,"ONE"],[3,4,"THREE\nFOUR"]]), e2=edit("R2",[[2,2,"BETA"]]); const args=[JSON.stringify({path:"file.txt",expectedSha256:hash(a),edits:[{oldText:a,newText:an}]}),JSON.stringify({path:"second.txt",expectedSha256:hash(b),edits:[{oldText:b,newText:bn}]})]; const edits=packet(e1,e2), eb=args.reduce((n,x)=>n+Buffer.byteLength(x),0); console.log(JSON.stringify({existingFilePacketBytes:Buffer.byteLength(edits),existingFileExpandedCanonicalBytes:eb,existingFileTransmissionRatio:Buffer.byteLength(edits)/eb,byteIdenticalExpected:{fileTxt:an,secondTxt:bn}},null,2));'
```

No live workload command was run.
