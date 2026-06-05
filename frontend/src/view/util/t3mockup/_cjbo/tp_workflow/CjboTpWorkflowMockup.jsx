import React from 'react';
import PlanWorkflowView from '../_shared_plan_workflow/PlanWorkflowView';

// CJBO — TP (Target / 목표) 계획 워크플로
// 소스: view/demandplan/targetplan/{controlboard,processstatus,entry,entrychart}/*.jsx
// 모두 thin wrapper → Base{ControlBoard,ProcessStatus,Entry} 공유.
// planTypeCode='DP_PLAN_TARGET' · hasChart=true (entrychart/) · ControlBoard 의 VER_INFO 에 DP_YEARPLAN_YN/RATIO_COPY_YN/SIMUL_YN 표시

export default function CjboTpWorkflowMockup() {
  return (
    <PlanWorkflowView
      planTypeCode="DP_PLAN_TARGET"
      planTypeLabel="TP / 목표 계획"
      hasChart={true}
      menuCdControlBoard="UI_DT_93"
      menuCdProcessStatus="UI_DT_94"
      menuCdEntry="UI_DT_95"
      patternCode="cjbo_tp_workflow"
    />
  );
}
