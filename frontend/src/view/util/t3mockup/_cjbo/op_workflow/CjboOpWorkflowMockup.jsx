import React from 'react';
import PlanWorkflowView from '../_shared_plan_workflow/PlanWorkflowView';

// CJBO — OP (월간) 계획 워크플로
// 소스: view/demandplan/{version/controlboard,version/processstatus,entry/entry}/*.jsx
// 모두 thin wrapper → Base{ControlBoard,ProcessStatus,Entry} 공유.
// planTypeCode='DP_PLAN_MONTHLY' · hasChart=false

export default function CjboOpWorkflowMockup() {
  return (
    <PlanWorkflowView
      planTypeCode="DP_PLAN_MONTHLY"
      planTypeLabel="OP / 월간 계획"
      hasChart={false}
      menuCdControlBoard="UI_DP_93"
      menuCdProcessStatus="UI_DP_94"
      menuCdEntry="UI_DP_95"
      patternCode="cjbo_op_workflow"
    />
  );
}
