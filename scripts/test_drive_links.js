
const testId = '1twU_grSbHVakePV6pbq6YHQKia4WzvQN';

async function testLinks() {
    const link = `https://drive.google.com/thumbnail?id=${testId}&sz=w800`;
    try {
        const res = await fetch(link, { method: 'HEAD' });
        console.log(`Link: ${link} -> Status: ${res.status} (${res.statusText})`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
    } catch (err) {
        console.log(`Link: ${link} -> Error: ${err.message}`);
    }
}

testLinks();
