import React from 'react';
import PlanWorkflowView from '../_shared_plan_workflow/PlanWorkflowView';

// CJBO — BP (Yearly / 연간) 계획 워크플로
// 소스: view/demandplan/yearlyplan/{controlboard,processstatus,entry,entrychart}/*.jsx
// 모두 thin wrapper → Base{ControlBoard,ProcessStatus,Entry} 공유.
// planTypeCode='DP_PLAN_YEARLY' · hasChart=true

export default function CjboBpWorkflowMockup() {
  return (
    <PlanWorkflowView
      planTypeCode="DP_PLAN_YEARLY"
      planTypeLabel="BP / 연간 계획"
      hasChart={true}
      menuCdControlBoard="UI_BP_93"
      menuCdProcessStatus="UI_BP_94"
      menuCdEntry="UI_BP_95"
      patternCode="cjbo_bp_workflow"
    />
  );
}
