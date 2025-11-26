import json

# Load the 2026 structure
with open('2026_structure.json', 'r') as f:
    structure_2026 = json.load(f)

# Generate tasks.json
tasks = []
for domain_id, domain_data in structure_2026.items():
    for task_data in domain_data['tasks']:
        # Create description from first few enablers
        enabler_preview = ', '.join(task_data['enablers'][:2])
        description = f"{enabler_preview}"
        if len(task_data['enablers']) > 2:
            description += f", and {len(task_data['enablers']) - 2} more actions."
        
        tasks.append({
            "id": task_data['id'],
            "domainId": domain_id,
            "title": task_data['title'],
            "description": description
        })

# Generate enablers.json
enablers = []
for domain_id, domain_data in structure_2026.items():
    for task_data in domain_data['tasks']:
        task_id = task_data['id']
        for idx, enabler_text in enumerate(task_data['enablers'], 1):
            enabler_id = f"e-{task_id}-{idx}"
            enablers.append({
                "id": enabler_id,
                "taskId": task_id,
                "text": enabler_text
            })

# Save tasks.json
with open('src/data/tasks.json', 'w') as f:
    json.dump(tasks, f, indent=2)
    f.write('\n')

# Save enablers.json
with open('src/data/enablers.json', 'w') as f:
    json.dump(enablers, f, indent=2)
    f.write('\n')

print(f"✓ Generated tasks.json with {len(tasks)} tasks")
print(f"✓ Generated enablers.json with {len(enablers)} enablers")

# Print summary
from collections import defaultdict
tasks_by_domain = defaultdict(int)
enablers_by_domain = defaultdict(int)

for task in tasks:
    tasks_by_domain[task['domainId']] += 1

for enabler in enablers:
    domain = enabler['taskId'].split('-')[0]
    enablers_by_domain[domain] += 1

print("\nBy Domain:")
for domain in ['people', 'process', 'business']:
    print(f"  {domain.title()}: {tasks_by_domain[domain]} tasks, {enablers_by_domain[domain]} enablers")
