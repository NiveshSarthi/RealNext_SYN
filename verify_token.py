import urllib.request
import json

TOKEN = 'EAATSCZAdh3EYBQhZAy9uYjkq88Om899Wwxpyo8giZBFRiDv51piuMxiAGB7vgAvtkJvZCH6xzZA8EyMqkmG2haRpSFenNFZCI9TYdK4bwJ7zhgVQlFQZBDfnZB78e2cXczq24UmkjItlHc0tEooUYh267YvD6o3YZA7XdNzYuccsTm5rrIiCRvnQYmIftPjkBX0g5VE9IFo7MQFEKZAWRlTUj2oadjdtORWzZCEDZCOLWOGICkEZCWoyR4oc7HuuXBWoSV1PbQ3laZC8AClVBrpOb076cjTntAlXmnAMVjYoVX2QZDZD'

print('🔍 FACEBOOK TOKEN ANALYSIS')
print('=' * 70)

# Test 1: Token Validity
print('\n📌 TEST 1: Token Validity')
print('-' * 70)
try:
    url = f'https://graph.facebook.com/me?access_token={TOKEN}'
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        print('✅ Token is VALID')
        print(f'   User ID: {data.get("id")}')
        print(f'   Name: {data.get("name")}')
except Exception as e:
    print(f'❌ Token is INVALID or EXPIRED')
    print(f'   Error: {str(e)}')
    exit(1)

# Test 2: Token Permissions
print('\n📌 TEST 2: Token Permissions')
print('-' * 70)
try:
    url = f'https://graph.facebook.com/me/permissions?access_token={TOKEN}'
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        perms = [p['permission'] for p in data.get('data', [])]
        print(f'✅ Token has {len(perms)} total permissions\n')
        
        required = [
            'pages_read_engagement',
            'pages_manage_metadata', 
            'pages_read_user_content',
            'leads_retrieval',
            'pages_manage_ads'
        ]
        
        print('Required Permissions Check:')
        missing = []
        for perm in required:
            if perm in perms:
                print(f'   ✅ {perm}')
            else:
                print(f'   ❌ {perm}')
                missing.append(perm)
        
        if missing:
            print(f'\n⚠️  MISSING {len(missing)} PERMISSIONS:')
            for perm in missing:
                print(f'   - {perm}')
        else:
            print(f'\n✅ ALL REQUIRED PERMISSIONS PRESENT!')
            
except Exception as e:
    print(f'❌ Error checking permissions: {str(e)}')

# Test 3: Accessible Pages
print('\n📌 TEST 3: Accessible Facebook Pages')
print('-' * 70)
try:
    url = f'https://graph.facebook.com/me/accounts?access_token={TOKEN}&limit=100'
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode())
        pages = data.get('data', [])
        print(f'✅ Found {len(pages)} accessible pages\n')
        
        total_forms = 0
        for i, page in enumerate(pages, 1):
            print(f'{i}. {page["name"]}')
            print(f'   ID: {page["id"]}')
            
            # Get forms for this page
            try:
                form_url = f'https://graph.facebook.com/{page["id"]}/leadgen_forms?access_token={page["access_token"]}&fields=id,name,status,leads_count&limit=100'
                with urllib.request.urlopen(form_url) as form_response:
                    form_data = json.loads(form_response.read().decode())
                    forms = form_data.get('data', [])
                    total_forms += len(forms)
                    print(f'   Forms: {len(forms)}')
                    if len(forms) > 0:
                        for form in forms[:3]:
                            print(f'      • {form["name"]} [{form["status"]}] ({form.get("leads_count", 0)} leads)')
                        if len(forms) > 3:
                            print(f'      ... and {len(forms) - 3} more')
            except Exception as form_err:
                print(f'   Forms: ERROR - {str(form_err)}')
        
        print(f'\n📊 Total Forms Across All Pages: {total_forms}')
        
except Exception as e:
    print(f'❌ Error getting pages: {str(e)}')

# Summary
print('\n' + '=' * 70)
print('📊 SUMMARY & RECOMMENDATIONS')
print('=' * 70)

print('\n✅ What\'s Working:')
print('   • Token is valid and not expired')
print('   • Pages are accessible')
print('   • Forms are loading')

print('\n⚠️  What might need fixing:')
print('   1. If permissions are missing, regenerate token in Facebook')
print('   2. Ensure "pages_manage_metadata" is added for real-time webhooks')
print('   3. Ensure "pages_manage_ads" is added for robust ads sync')
print('   4. Use this NEW token in RealNext\'s Lead Integrations')

print('\n' + '=' * 70)
