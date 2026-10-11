import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {backupTables,snapshotSQL,sqlValue} from '../lib/backup-core.mjs';
test('backup SQL restores quotes, Korean, nulls and every table into SQLite',()=>{const schema=backupTables.map(name=>({name,sql:`CREATE TABLE "${name}" (id TEXT PRIMARY KEY, value TEXT, score INTEGER)`}));const data=Object.fromEntries(backupTables.map(name=>[name,[{id:name,value:"길드 '고양이'\n기록",score:null}]]));data.guild_state.push({id:'nul',value:'a\0b',score:3});const sql=snapshotSQL(schema,data,'2026-10-10T00:00:00Z');const result=spawnSync('python',['-c',"import sqlite3,sys,json; db=sqlite3.connect(':memory:');db.executescript(sys.stdin.read());print(json.dumps(db.execute('SELECT value,score FROM guild_state ORDER BY id').fetchall()))"],{input:sql,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),[["길드 '고양이'\n기록",null],['a\0b',3]]);});
test('missing schemas and unsupported values cannot silently corrupt backups',()=>{assert.throws(()=>snapshotSQL([], {guild_state:[]},'stamp'),/스키마 누락/);assert.throws(()=>sqlValue({secret:'x'}),/형식/);});
