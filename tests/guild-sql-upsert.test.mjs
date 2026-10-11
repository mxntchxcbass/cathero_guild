import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {guildSQL} from '../lib/guild-sql.mjs';
test('sheet connection upsert retains lock condition and isolates guild',()=>{
 const base="INSERT INTO sheet_sync(id,sheet_id,requested,completed,lock_until) VALUES('guild',?,0,0,0) ON CONFLICT(id) DO UPDATE SET sheet_id=?,completed=requested,last_success=NULL,last_error=NULL WHERE sheet_sync.lock_until<?";
 const sql=guildSQL(base,'legacy');
 const result=execFileSync('python',['-c',`import sqlite3,json,sys
c=sqlite3.connect(':memory:')
c.execute('CREATE TABLE sheet_sync(id TEXT PRIMARY KEY,guild_id TEXT,sheet_id TEXT,requested INTEGER,completed INTEGER,lock_until INTEGER,last_success TEXT,last_error TEXT)')
s=json.load(sys.stdin)
c.execute(s,('first','first',10))
c.execute(s,('second','second',10))
assert c.execute('SELECT sheet_id FROM sheet_sync').fetchone()[0]=='second'
c.execute('UPDATE sheet_sync SET lock_until=20')
c.execute(s,('blocked','blocked',10))
assert c.execute('SELECT sheet_id FROM sheet_sync').fetchone()[0]=='second'
c.execute("UPDATE sheet_sync SET guild_id='other',lock_until=0")
c.execute(s,('cross-guild','cross-guild',10))
assert c.execute('SELECT sheet_id FROM sheet_sync').fetchone()[0]=='second'
print('ok')`],{input:JSON.stringify(sql),encoding:'utf8'});
 assert.equal(result.trim(),'ok');
});
