import json
from pathlib import Path
import fitz

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTLINE_DIR = ROOT_DIR / "data" / "reference" / "exam-outline"
OUTLINE_PATH = OUTLINE_DIR / "2026_structure.json"

# Open the 2026 PDF
doc = fitz.open('references/New-PMP-Examination-Content-Outline-2026.pdf')

# Structure to hold the extracted data
domains_2026 = {
    'people': {'name': 'People', 'percentage': 33, 'tasks': []},
    'process': {'name': 'Process', 'percentage': 41, 'tasks': []},
    'business': {'name': 'Business Environment', 'percentage': 26, 'tasks': []}
}

# Extract full text from pages 7-12
full_text = ""
for page_num in range(6, 12):  # Pages 7-12 (0-indexed 6-11)
    full_text += doc[page_num].get_text()

doc.close()

# Manually parse the structure based on the PDF content
# DOMAIN I - PEOPLE (33%)
domains_2026['people']['tasks'] = [
    {
        'id': 'people-1',
        'title': 'Develop a common vision',
        'enablers': [
            'Help ensure a shared vision with key stakeholders.',
            'Promote the shared vision.',
            'Keep the vision current.',
            'Break down situations to identify the root cause of a misunderstanding of the vision.'
        ]
    },
    {
        'id': 'people-2',
        'title': 'Manage conflicts',
        'enablers': [
            'Identify conflict sources.',
            'Analyze the context for the conflict.',
            'Implement an agreed-on resolution strategy.',
            'Communicate conflict management principles with the team and external stakeholders.',
            'Establish an environment that fosters adherence to common ground rules.',
            'Manage and rectify ground rule violations.'
        ]
    },
    {
        'id': 'people-3',
        'title': 'Lead the project team',
        'enablers': [
            'Establish expectations at the team level.',
            'Empower the team.',
            'Solve problems.',
            'Represent the voice of the team.',
            "Support the team's varied experiences, skills, and perspectives.",
            'Determine an appropriate leadership style.',
            'Establish clear roles and responsibilities within the team.'
        ]
    },
    {
        'id': 'people-4',
        'title': 'Engage stakeholders',
        'enablers': [
            'Identify stakeholders.',
            'Analyze stakeholders.',
            'Analyze and tailor communication to stakeholder needs.',
            'Execute the stakeholder engagement plan.',
            'Optimize alignment among stakeholder needs, expectations, and project objectives.',
            'Build trust and influence stakeholders to accomplish project objectives.'
        ]
    },
    {
        'id': 'people-5',
        'title': 'Align stakeholder expectations',
        'enablers': [
            'Categorize stakeholders.',
            'Identify stakeholder expectations.',
            'Facilitate discussions to align expectations.',
            'Organize and act on mentoring opportunities.'
        ]
    },
    {
        'id': 'people-6',
        'title': 'Manage stakeholder expectations',
        'enablers': [
            'Identify internal and external customer expectations.',
            'Align and maintain outcomes to internal and external customer expectations.',
            'Monitor internal and external customer satisfaction/expectations and respond as needed.'
        ]
    },
    {
        'id': 'people-7',
        'title': 'Develop and manage the project team',
        'enablers': [
            'Assess current team structure and skills.',
            'Plan for team development.',
            'Determine competencies and training.',
            'Develop project team.',
            'Support team performance.',
            'Assess team member performance.'
        ]
    },
    {
        'id': 'people-8',
        'title': 'Help ensure knowledge transfer',
        'enablers': [
            'Identify knowledge critical to the project.',
            'Gather knowledge.',
            'Foster an environment for knowledge transfer.'
        ]
    }
]

# DOMAIN II - PROCESS (41%)
domains_2026['process']['tasks'] = [
    {
        'id': 'process-1',
        'title': 'Develop an integrated project management plan and plan delivery',
        'enablers': [
            'Assess project needs, complexity, and magnitude.',
            'Recommend a project management development approach (i.e., predictive, adaptive/agile, or hybrid management).',
            'Determine critical information requirements (e.g., sustainability).',
            'Recommend a project execution strategy.',
            'Create an integrated project management plan.',
            'Estimate work effort and resource requirements.',
            'Assess consolidated project plans for dependencies, gaps, and continued business value.',
            'Maintain the integrated project management plan.',
            'Collect and analyze data to make informed project decisions.'
        ]
    },
    {
        'id': 'process-2',
        'title': 'Develop and manage project scope',
        'enablers': [
            'Define scope.',
            'Obtain stakeholder agreement on project scope.',
            'Break down scope.'
        ]
    },
    {
        'id': 'process-3',
        'title': 'Help ensure value-based delivery',
        'enablers': [
            'Identify value components with key stakeholders.',
            'Prioritize work based on value and stakeholder feedback.',
            'Assess opportunities to deliver value incrementally.',
            'Examine the business value throughout the project.',
            'Verify a measurement system is in place to track benefits.',
            'Evaluate delivery options to demonstrate value.'
        ]
    },
    {
        'id': 'process-4',
        'title': 'Plan and manage resources',
        'enablers': [
            'Define and plan resources based on requirements.',
            'Manage and optimize resource needs and availability.'
        ]
    },
    {
        'id': 'process-5',
        'title': 'Plan and manage procurement',
        'enablers': [
            'Plan procurement.',
            'Execute a procurement management plan.',
            'Select preferred contract types.',
            'Evaluate vendor performance.',
            'Verify objectives of the procurement agreement are met.',
            'Participate in agreement negotiations.',
            'Determine a negotiation strategy.',
            'Manage suppliers and contracts.',
            'Plan and manage the procurement strategy.',
            'Develop a delivery solution.'
        ]
    },
    {
        'id': 'process-6',
        'title': 'Plan and manage budget',
        'enablers': [
            'Estimate budget.',
            'Create a project budget.',
            'Baseline a project budget.',
            'Execute a budget management plan.',
            'Analyze budget variation.',
            'Manage financial reserves.'
        ]
    },
    {
        'id': 'process-7',
        'title': 'Plan and optimize quality of products/deliverables',
        'enablers': [
            'Gather quality requirements for project deliverables.',
            'Plan quality processes and tools.',
            'Execute a quality management plan.',
            'Help ensure regulatory compliance.',
            'Manage cost of quality (CoQ) and sustainability.',
            'Conduct ongoing quality reviews.',
            'Implement continuous improvement.'
        ]
    },
    {
        'id': 'process-8',
        'title': 'Plan and manage schedule',
        'enablers': [
            'Prepare a schedule based on the selected development approach.',
            'Coordinate with other projects and operations.',
            'Estimate project tasks (milestones, dependencies, story points).',
            'Utilize benchmarks and historical data.',
            'Create a project schedule.',
            'Baseline a project schedule.',
            'Execute a schedule management plan.',
            'Analyze schedule variation.'
        ]
    },
    {
        'id': 'process-9',
        'title': 'Evaluate project status',
        'enablers': [
            'Develop project metrics, analysis, and reconciliation.',
            'Identify and tailor needed artifacts.',
            'Help ensure artifacts are created, reviewed, updated, and documented.',
            'Help ensure accessibility of artifacts.',
            'Assess current progress.',
            'Measure, analyze, and update project metrics.',
            'Communicate project status.',
            'Continually assess the effectiveness of artifact management.'
        ]
    },
    {
        'id': 'process-10',
        'title': 'Manage project closure',
        'enablers': [
            'Obtain project stakeholder approval of project completion.',
            'Determine criteria to successfully close the project or phase.',
            'Validate readiness for transition (e.g., to operations team or next phase).',
            'Conclude activities to close the project or phase (e.g., final lessons learned, retrospectives, procurement, financials, resources).'
        ]
    },
    {
        'id': 'process-11',
        'title': 'Plan and manage communications',
        'enablers': [
            'Determine communication needs.',
            'Create a communication plan.',
            'Execute a communication management plan.',
            'Utilize communication tools.'
        ]
    },
    {
        'id': 'process-12',
        'title': 'Manage project artifacts',
        'enablers': [
            'Identify needed artifacts.',
            'Help ensure artifacts are created, reviewed, updated, and documented.',
            'Help ensure accessibility of artifacts.'
        ]
    }
]

# DOMAIN III - BUSINESS ENVIRONMENT (26%)
domains_2026['business']['tasks'] = [
    {
        'id': 'business-1',
        'title': 'Define and establish project governance',
        'enablers': [
            'Describe and establish the structure, rules, procedures, reporting, ethics, and policies through the use of organizational process assets (OPAs).',
            'Define success metrics.',
            'Outline governance escalation paths and thresholds.'
        ]
    },
    {
        'id': 'business-2',
        'title': 'Plan and manage project compliance',
        'enablers': [
            'Confirm project compliance requirements (e.g., security, health and safety, sustainability, regulatory compliance).',
            'Classify compliance categories.',
            'Determine potential threats to compliance.',
            'Use methods to support compliance.',
            'Analyze the consequences of noncompliance.',
            'Determine the necessary approach and action(s) to address compliance needs.',
            'Measure the extent to which the project is in compliance.'
        ]
    },
    {
        'id': 'business-3',
        'title': 'Manage and control changes',
        'enablers': [
            'Execute the change control process.',
            'Communicate the status of proposed changes.',
            'Implement approved changes to the project.',
            'Update project documentation to reflect changes.'
        ]
    },
    {
        'id': 'business-4',
        'title': 'Remove impediments and manage issues',
        'enablers': [
            'Evaluate the impact of impediments.',
            'Prioritize and highlight impediments.',
            'Determine and apply an intervention strategy to remove/minimize impediments.',
            'Reassess continually to help ensure impediments, obstacles, and blockers for the team are being addressed.',
            'Recognize when a risk becomes an issue.',
            'Collaborate with relevant stakeholders on an approach to resolve the issues.'
        ]
    },
    {
        'id': 'business-5',
        'title': 'Plan and manage risk',
        'enablers': [
            'Identify risks.',
            'Analyze risks.',
            'Monitor and control risks.',
            'Develop a risk management plan.',
            'Maintain a risk register (e.g., poor IT security).',
            'Execute a risk management plan (e.g., risk response for security and managing sustainability risks).',
            'Communicate the status of a risk impact on the project.'
        ]
    },
    {
        'id': 'business-6',
        'title': 'Continuous improvement',
        'enablers': [
            'Utilize lessons learned.',
            'Help ensure continuous improvement processes are updated.',
            'Update organizational process assets (OPAs).'
        ]
    },
    {
        'id': 'business-7',
        'title': 'Support organizational change',
        'enablers': [
            'Assess organizational culture.',
            'Evaluate the impact of organizational change on the project and determine required actions.'
        ]
    },
    {
        'id': 'business-8',
        'title': 'Evaluate external business environment changes',
        'enablers': [
            'Survey changes to the external business environment (e.g., regulations, technology, geopolitical, market).',
            'Assess and prioritize the impact on project scope/backlog based on changes in the external business environment.',
            'Continually review the external business environment for impacts on project scope/backlog.'
        ]
    }
]

# Print summary
print("2026 PMP EXAM STRUCTURE")
print("=" * 80)
for domain_id, domain_data in domains_2026.items():
    print(f"\n{domain_data['name'].upper()} - {domain_data['percentage']}%")
    print(f"Total tasks: {len(domain_data['tasks'])}")
    total_enablers = sum(len(task['enablers']) for task in domain_data['tasks'])
    print(f"Total enablers: {total_enablers}")
    for task in domain_data['tasks']:
        print(f"  {task['id']}: {task['title']} ({len(task['enablers'])} enablers)")

# Save to JSON file for reference
OUTLINE_DIR.mkdir(parents=True, exist_ok=True)
with OUTLINE_PATH.open('w', encoding='utf-8') as f:
    json.dump(domains_2026, f, indent=2)

print(f"\n\nSaved to {OUTLINE_PATH.relative_to(ROOT_DIR)}")
