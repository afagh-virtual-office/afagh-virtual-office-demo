import test from "node:test";
import assert from "node:assert/strict";
import {createState,appendEvidence,verifyEvidence} from "../src/state.mjs";
test("evidence chain verifies",()=>{const s=createState({project:{},teams:[],gates:[],tasks:[],decisions:[],audit:[]});appendEvidence(s,"TEST","test",{ok:true});appendEvidence(s,"TEST","test",{ok:true});assert.equal(verifyEvidence(s).valid,true);});
test("evidence tampering is detected",()=>{const s=createState({project:{},teams:[],gates:[],tasks:[],decisions:[],audit:[]});appendEvidence(s,"TEST","test",{ok:true});s.evidence[0].payload.ok=false;assert.equal(verifyEvidence(s).valid,false);});