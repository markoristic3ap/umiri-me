import requests
import sys
import json
from datetime import datetime, timezone

class MoodTrackerAPITester:
    def __init__(self, base_url="https://mood-tracker-321.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            
            success = response.status_code == expected_status
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except json.JSONDecodeError:
                    # Handle non-JSON responses like CSV
                    self.log_test(name, True)
                    return True, response.text
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Status {response.status_code}, Error: {error_data}")
                except:
                    self.log_test(name, False, f"Status {response.status_code}")
                return False, {}
                
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test /api/ endpoint"""
        success, response = self.run_test("API Root", "GET", "", 200)
        if success and "message" in response:
            return response.get("message") == "Umiri.me API"
        return False

    def test_mood_types(self):
        """Test /api/mood-types returns 8 mood types"""
        success, response = self.run_test("Mood Types", "GET", "mood-types", 200)
        if success:
            mood_count = len(response) if isinstance(response, dict) else 0
            if mood_count == 8:
                print(f"   Mood types count: {mood_count} ✓")
                return True
            else:
                print(f"   Expected 8 mood types, got {mood_count}")
                self.failed_tests.append({"test": "Mood Types Count", "error": f"Expected 8, got {mood_count}"})
        return False

    def create_test_session(self):
        """Create test session using mongosh"""
        print("\n🔧 Creating test user and session...")
        try:
            import subprocess
            mongo_cmd = '''
            mongosh --eval "
            use('test_database');
            var userId = 'test-user-' + Date.now();
            var sessionToken = 'test_session_' + Date.now();
            db.users.insertOne({
              user_id: userId,
              email: 'test.user.' + Date.now() + '@example.com',
              name: 'Test User',
              picture: 'https://via.placeholder.com/150',
              created_at: new Date().toISOString()
            });
            db.user_sessions.insertOne({
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            print('SESSION_TOKEN:' + sessionToken);
            print('USER_ID:' + userId);
            "
            '''
            
            result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            for line in result.stdout.split('\n'):
                if 'SESSION_TOKEN:' in line:
                    self.session_token = line.split('SESSION_TOKEN:')[1].strip()
                elif 'USER_ID:' in line:
                    self.test_user_id = line.split('USER_ID:')[1].strip()
            
            if self.session_token and self.test_user_id:
                print(f"✅ Created test session: {self.session_token[:20]}...")
                print(f"✅ Created test user: {self.test_user_id}")
                return True
            else:
                print("❌ Failed to extract session token or user ID")
                return False
                
        except Exception as e:
            print(f"❌ Error creating test session: {e}")
            return False

    def test_auth_me(self):
        """Test /api/auth/me with valid session"""
        if not self.session_token:
            self.log_test("Auth Me", False, "No session token available")
            return False
        
        success, response = self.run_test("Auth Me", "GET", "auth/me", 200)
        if success and "user_id" in response:
            print(f"   User: {response.get('name', 'N/A')} ({response.get('email', 'N/A')})")
            return True
        return False

    def test_create_mood(self):
        """Test POST /api/moods creates a mood entry"""
        if not self.session_token:
            self.log_test("Create Mood", False, "No session token available")
            return False
        
        mood_data = {
            "mood_type": "srecan",
            "note": "Test mood entry from automated testing"
        }
        success, response = self.run_test("Create Mood", "POST", "moods", 201, mood_data)
        if success and "mood_id" in response:
            print(f"   Created mood: {response.get('label')} {response.get('emoji')}")
            return True
        return False

    def test_get_moods(self):
        """Test GET /api/moods returns mood entries"""
        if not self.session_token:
            self.log_test("Get Moods", False, "No session token available")
            return False
        
        success, response = self.run_test("Get Moods", "GET", "moods", 200)
        if success and isinstance(response, list):
            print(f"   Retrieved {len(response)} mood entries")
            return True
        return False

    def test_calendar_data(self):
        """Test GET /api/moods/calendar/2026/2 returns calendar data"""
        if not self.session_token:
            self.log_test("Calendar Data", False, "No session token available")
            return False
        
        success, response = self.run_test("Calendar Data", "GET", "moods/calendar/2026/2", 200)
        if success and isinstance(response, list):
            print(f"   Retrieved {len(response)} calendar entries for Feb 2026")
            return True
        return False

    def test_mood_stats(self):
        """Test GET /api/moods/stats returns statistics"""
        if not self.session_token:
            self.log_test("Mood Stats", False, "No session token available")
            return False
        
        success, response = self.run_test("Mood Stats", "GET", "moods/stats", 200)
        if success and "total" in response:
            print(f"   Stats - Total: {response.get('total')}, Streak: {response.get('streak')}")
            return True
        return False

    def test_export_moods(self):
        """Test GET /api/moods/export returns CSV file"""
        if not self.session_token:
            self.log_test("Export Moods", False, "No session token available")
            return False
        
        success, response = self.run_test("Export Moods", "GET", "moods/export", 200)
        if success and isinstance(response, str) and "Datum" in response:
            print(f"   CSV export successful (length: {len(response)} chars)")
            return True
        return False

    def test_gamification_stats(self):
        """Test GET /api/gamification/stats returns badges and streak data"""
        if not self.session_token:
            self.log_test("Gamification Stats", False, "No session token available")
            return False
        
        success, response = self.run_test("Gamification Stats", "GET", "gamification/stats", 200)
        if success and "badges" in response and "streak" in response:
            badges_count = len(response.get("badges", []))
            earned_badges = len([b for b in response.get("badges", []) if b.get("earned")])
            print(f"   Badges: {earned_badges}/{badges_count} earned, Streak: {response.get('streak')}")
            return True
        return False

    def test_ai_tips(self):
        """Test POST /api/ai/tips returns AI-generated tip"""
        if not self.session_token:
            self.log_test("AI Tips", False, "No session token available")
            return False
        
        success, response = self.run_test("AI Tips", "POST", "ai/tips", 200)
        if success and "tip" in response:
            tip_text = response.get("tip", "")
            print(f"   AI tip generated (length: {len(tip_text)} chars)")
            return True
        return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🧪 Starting Umiri.me Backend API Testing")
        print("=" * 50)
        
        # Test public endpoints first
        print("\n📡 Testing Public Endpoints...")
        self.test_root_endpoint()
        self.test_mood_types()
        
        # Create test session for auth-protected endpoints
        if not self.create_test_session():
            print("❌ Cannot proceed with auth tests - session creation failed")
            self.print_summary()
            return 1
        
        print("\n🔐 Testing Auth-Protected Endpoints...")
        self.test_auth_me()
        self.test_create_mood()
        self.test_get_moods()
        self.test_calendar_data()
        self.test_mood_stats()
        self.test_export_moods()
        self.test_gamification_stats()
        self.test_ai_tips()
        
        self.print_summary()
        return 0 if self.tests_passed == self.tests_run else 1

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")

if __name__ == "__main__":
    tester = MoodTrackerAPITester()
    sys.exit(tester.run_all_tests())