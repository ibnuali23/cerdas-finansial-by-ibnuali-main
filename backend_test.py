#!/usr/bin/env python3
"""
Comprehensive backend API testing for Cerdas Finansial
Tests all endpoints, user isolation, admin functionality, and balance calculations
"""

import requests
import sys
import json
from datetime import datetime, date
from typing import Dict, Any, Optional

class CerdasFinansialTester:
    def __init__(self, base_url="https://budget-cerdas.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.admin_user_id = None
        self.regular_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, token: Optional[str] = None, 
                 params: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                try:
                    return False, response.json()
                except:
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login with seed credentials"""
        print("\n=== Testing Admin Login ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "moebarokocu@gmail.com", "password": "261256"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print("✅ Admin token obtained")
            return True
        return False

    def test_admin_profile(self):
        """Test admin profile and role verification"""
        print("\n=== Testing Admin Profile ===")
        success, response = self.run_test(
            "Admin Profile",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        if success:
            self.admin_user_id = response.get('id')
            if response.get('role') == 'admin' and response.get('name') == 'Presiden Mubarak':
                print("✅ Admin profile verified - correct role and name")
                return True
            else:
                print(f"❌ Admin profile incorrect: role={response.get('role')}, name={response.get('name')}")
        return False

    def test_user_registration(self):
        """Test new user registration with auto-seeding"""
        print("\n=== Testing User Registration ===")
        timestamp = datetime.now().strftime("%H%M%S")
        test_user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "testpass123",
            "confirm_password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        if success and 'token' in response:
            self.user_token = response['token']
            print("✅ User registration successful, token obtained")
            
            # Get user profile
            success, profile = self.run_test(
                "New User Profile",
                "GET",
                "auth/me",
                200,
                token=self.user_token
            )
            if success:
                self.regular_user_id = profile.get('id')
                print(f"✅ User profile: {profile.get('name')} ({profile.get('email')})")
                return True
        return False

    def test_auto_seeded_data(self):
        """Test that new user gets auto-seeded payment methods, categories, etc."""
        print("\n=== Testing Auto-Seeded Data ===")
        
        # Test payment methods
        success, pm_data = self.run_test(
            "Auto-seeded Payment Methods",
            "GET",
            "payment-methods",
            200,
            token=self.user_token
        )
        if success and len(pm_data) >= 4:  # Should have Cash, GoPay, Dana, Bank
            print(f"✅ Payment methods seeded: {len(pm_data)} methods")
        else:
            print(f"❌ Payment methods not properly seeded: {len(pm_data) if success else 0}")
            return False

        # Test income categories
        success, inc_cats = self.run_test(
            "Auto-seeded Income Categories",
            "GET",
            "categories",
            200,
            params={"kind": "income"},
            token=self.user_token
        )
        if success and len(inc_cats) >= 1:
            print(f"✅ Income categories seeded: {len(inc_cats)} categories")
        else:
            print(f"❌ Income categories not seeded")
            return False

        # Test expense categories
        success, exp_cats = self.run_test(
            "Auto-seeded Expense Categories",
            "GET",
            "categories",
            200,
            params={"kind": "expense"},
            token=self.user_token
        )
        if success and len(exp_cats) >= 4:  # Should have Kebutuhan, Keinginan, Investasi, Dana Darurat
            print(f"✅ Expense categories seeded: {len(exp_cats)} categories")
        else:
            print(f"❌ Expense categories not seeded")
            return False

        # Test subcategories
        success, inc_subs = self.run_test(
            "Auto-seeded Income Subcategories",
            "GET",
            "subcategories",
            200,
            params={"kind": "income"},
            token=self.user_token
        )
        if success and len(inc_subs) >= 10:  # Should have many income subcategories
            print(f"✅ Income subcategories seeded: {len(inc_subs)} subcategories")
        else:
            print(f"❌ Income subcategories not properly seeded")
            return False

        return True

    def test_income_transaction_flow(self):
        """Test creating income transaction and balance update"""
        print("\n=== Testing Income Transaction Flow ===")
        
        # Get payment methods and categories first
        _, pm_data = self.run_test("Get Payment Methods", "GET", "payment-methods", 200, token=self.user_token)
        _, inc_cats = self.run_test("Get Income Categories", "GET", "categories", 200, params={"kind": "income"}, token=self.user_token)
        _, inc_subs = self.run_test("Get Income Subcategories", "GET", "subcategories", 200, params={"kind": "income"}, token=self.user_token)
        
        if not pm_data or not inc_cats or not inc_subs:
            print("❌ Failed to get required data for transaction")
            return False

        payment_method = pm_data[0]
        category = inc_cats[0]
        subcategory = inc_subs[0]
        
        # Record initial balance
        initial_balance = payment_method['balance']
        print(f"Initial balance: {initial_balance}")
        
        # Create income transaction
        transaction_data = {
            "type": "income",
            "date": date.today().isoformat(),
            "category_id": category['id'],
            "subcategory_id": subcategory['id'],
            "description": "Test salary income",
            "amount": 1000000,  # 1 million rupiah
            "payment_method_id": payment_method['id']
        }
        
        success, tx_response = self.run_test(
            "Create Income Transaction",
            "POST",
            "transactions",
            200,  # API returns 200, not 201
            data=transaction_data,
            token=self.user_token
        )
        
        if not success:
            return False
            
        # Check balance update
        _, updated_pm_data = self.run_test("Get Updated Payment Methods", "GET", "payment-methods", 200, token=self.user_token)
        updated_method = next((pm for pm in updated_pm_data if pm['id'] == payment_method['id']), None)
        
        if updated_method:
            expected_balance = initial_balance + 1000000
            actual_balance = updated_method['balance']
            if abs(actual_balance - expected_balance) < 0.01:  # Allow for floating point precision
                print(f"✅ Balance updated correctly: {initial_balance} -> {actual_balance}")
                return True
            else:
                print(f"❌ Balance not updated correctly: expected {expected_balance}, got {actual_balance}")
        
        return False

    def test_expense_transaction_flow(self):
        """Test creating expense transaction and balance update"""
        print("\n=== Testing Expense Transaction Flow ===")
        
        # Get payment methods and categories first
        _, pm_data = self.run_test("Get Payment Methods", "GET", "payment-methods", 200, token=self.user_token)
        _, exp_cats = self.run_test("Get Expense Categories", "GET", "categories", 200, params={"kind": "expense"}, token=self.user_token)
        _, exp_subs = self.run_test("Get Expense Subcategories", "GET", "subcategories", 200, params={"kind": "expense"}, token=self.user_token)
        
        if not pm_data or not exp_cats or not exp_subs:
            print("❌ Failed to get required data for expense transaction")
            return False

        payment_method = pm_data[0]
        category = exp_cats[0]
        
        # Find a subcategory that belongs to the selected category
        subcategory = None
        for sub in exp_subs:
            if sub['category_id'] == category['id']:
                subcategory = sub
                break
        
        if not subcategory:
            print(f"❌ No subcategory found for category {category['name']}")
            print(f"Available subcategories: {[s['name'] + ' (cat: ' + s['category_id'] + ')' for s in exp_subs[:3]]}")
            print(f"Selected category ID: {category['id']}")
            return False
        
        # Record initial balance
        initial_balance = payment_method['balance']
        print(f"Initial balance: {initial_balance}")
        print(f"Using category: {category['name']} ({category['id']})")
        print(f"Using subcategory: {subcategory['name']} ({subcategory['id']})")
        
        # Create expense transaction
        transaction_data = {
            "type": "expense",
            "date": date.today().isoformat(),
            "category_id": category['id'],
            "subcategory_id": subcategory['id'],
            "description": "Test food expense",
            "amount": 50000,  # 50k rupiah
            "payment_method_id": payment_method['id']
        }
        
        success, tx_response = self.run_test(
            "Create Expense Transaction",
            "POST",
            "transactions",
            200,  # API returns 200, not 201
            data=transaction_data,
            token=self.user_token
        )
        
        if not success:
            return False
            
        # Check balance update
        _, updated_pm_data = self.run_test("Get Updated Payment Methods", "GET", "payment-methods", 200, token=self.user_token)
        updated_method = next((pm for pm in updated_pm_data if pm['id'] == payment_method['id']), None)
        
        if updated_method:
            expected_balance = initial_balance - 50000
            actual_balance = updated_method['balance']
            if abs(actual_balance - expected_balance) < 0.01:
                print(f"✅ Balance updated correctly: {initial_balance} -> {actual_balance}")
                self.expense_tx_id = tx_response.get('id')  # Store for edit/delete tests
                return True
            else:
                print(f"❌ Balance not updated correctly: expected {expected_balance}, got {actual_balance}")
        
        return False

    def test_transaction_edit_flow(self):
        """Test editing transaction and balance recalculation"""
        print("\n=== Testing Transaction Edit Flow ===")
        
        if not hasattr(self, 'expense_tx_id'):
            print("❌ No expense transaction ID available for edit test")
            return False
            
        # Get current balance
        _, pm_data = self.run_test("Get Payment Methods Before Edit", "GET", "payment-methods", 200, token=self.user_token)
        payment_method = pm_data[0]
        balance_before_edit = payment_method['balance']
        
        # Get transaction data for editing
        _, exp_cats = self.run_test("Get Expense Categories", "GET", "categories", 200, params={"kind": "expense"}, token=self.user_token)
        _, exp_subs = self.run_test("Get Expense Subcategories", "GET", "subcategories", 200, params={"kind": "expense"}, token=self.user_token)
        
        # Find matching category and subcategory
        category = exp_cats[0]
        subcategory = None
        for sub in exp_subs:
            if sub['category_id'] == category['id']:
                subcategory = sub
                break
        
        if not subcategory:
            print("❌ No matching subcategory found for edit test")
            return False
        
        # Edit transaction with different amount
        edit_data = {
            "type": "expense",
            "date": date.today().isoformat(),
            "category_id": category['id'],
            "subcategory_id": subcategory['id'],
            "description": "Edited test expense",
            "amount": 75000,  # Changed from 50k to 75k
            "payment_method_id": payment_method['id']
        }
        
        success, _ = self.run_test(
            "Edit Transaction",
            "PUT",
            f"transactions/{self.expense_tx_id}",
            200,
            data=edit_data,
            token=self.user_token
        )
        
        if not success:
            return False
            
        # Check balance recalculation (should be 25k less than before edit)
        _, updated_pm_data = self.run_test("Get Payment Methods After Edit", "GET", "payment-methods", 200, token=self.user_token)
        updated_method = next((pm for pm in updated_pm_data if pm['id'] == payment_method['id']), None)
        
        if updated_method:
            expected_balance = balance_before_edit - 25000  # Difference between 75k and 50k
            actual_balance = updated_method['balance']
            if abs(actual_balance - expected_balance) < 0.01:
                print(f"✅ Balance recalculated correctly after edit: {balance_before_edit} -> {actual_balance}")
                return True
            else:
                print(f"❌ Balance not recalculated correctly: expected {expected_balance}, got {actual_balance}")
        
        return False

    def test_transaction_delete_flow(self):
        """Test deleting transaction and balance restoration"""
        print("\n=== Testing Transaction Delete Flow ===")
        
        if not hasattr(self, 'expense_tx_id'):
            print("❌ No expense transaction ID available for delete test")
            return False
            
        # Get current balance
        _, pm_data = self.run_test("Get Payment Methods Before Delete", "GET", "payment-methods", 200, token=self.user_token)
        payment_method = pm_data[0]
        balance_before_delete = payment_method['balance']
        
        # Delete transaction
        success, _ = self.run_test(
            "Delete Transaction",
            "DELETE",
            f"transactions/{self.expense_tx_id}",
            200,
            token=self.user_token
        )
        
        if not success:
            return False
            
        # Check balance restoration (should add back 75k)
        _, updated_pm_data = self.run_test("Get Payment Methods After Delete", "GET", "payment-methods", 200, token=self.user_token)
        updated_method = next((pm for pm in updated_pm_data if pm['id'] == payment_method['id']), None)
        
        if updated_method:
            expected_balance = balance_before_delete + 75000  # Add back the deleted expense
            actual_balance = updated_method['balance']
            if abs(actual_balance - expected_balance) < 0.01:
                print(f"✅ Balance restored correctly after delete: {balance_before_delete} -> {actual_balance}")
                return True
            else:
                print(f"❌ Balance not restored correctly: expected {expected_balance}, got {actual_balance}")
        
        return False

    def test_transfer_flow(self):
        """Test transfer between payment methods"""
        print("\n=== Testing Transfer Flow ===")
        
        # Get payment methods
        _, pm_data = self.run_test("Get Payment Methods for Transfer", "GET", "payment-methods", 200, token=self.user_token)
        
        if len(pm_data) < 2:
            print("❌ Need at least 2 payment methods for transfer test")
            return False
            
        from_method = pm_data[0]
        to_method = pm_data[1]
        
        from_balance_before = from_method['balance']
        to_balance_before = to_method['balance']
        transfer_amount = 100000
        
        # Create transfer
        transfer_data = {
            "date": date.today().isoformat(),
            "from_payment_method_id": from_method['id'],
            "to_payment_method_id": to_method['id'],
            "amount": transfer_amount,
            "description": "Test transfer between methods"
        }
        
        success, _ = self.run_test(
            "Create Transfer",
            "POST",
            "transfers",
            200,  # API returns 200, not 201
            data=transfer_data,
            token=self.user_token
        )
        
        if not success:
            return False
            
        # Check balance updates
        _, updated_pm_data = self.run_test("Get Payment Methods After Transfer", "GET", "payment-methods", 200, token=self.user_token)
        
        updated_from = next((pm for pm in updated_pm_data if pm['id'] == from_method['id']), None)
        updated_to = next((pm for pm in updated_pm_data if pm['id'] == to_method['id']), None)
        
        if updated_from and updated_to:
            expected_from_balance = from_balance_before - transfer_amount
            expected_to_balance = to_balance_before + transfer_amount
            
            from_correct = abs(updated_from['balance'] - expected_from_balance) < 0.01
            to_correct = abs(updated_to['balance'] - expected_to_balance) < 0.01
            
            if from_correct and to_correct:
                print(f"✅ Transfer balances updated correctly")
                print(f"   From: {from_balance_before} -> {updated_from['balance']}")
                print(f"   To: {to_balance_before} -> {updated_to['balance']}")
                return True
            else:
                print(f"❌ Transfer balances incorrect")
                print(f"   From: expected {expected_from_balance}, got {updated_from['balance']}")
                print(f"   To: expected {expected_to_balance}, got {updated_to['balance']}")
        
        return False

    def test_budget_overview(self):
        """Test budget overview functionality"""
        print("\n=== Testing Budget Overview ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        success, budget_data = self.run_test(
            "Budget Overview",
            "GET",
            "budgets/overview",
            200,
            params={"month": current_month},
            token=self.user_token
        )
        
        if success and 'rows' in budget_data:
            rows = budget_data['rows']
            print(f"✅ Budget overview retrieved: {len(rows)} budget rows")
            
            # Check if budget calculation includes our expense
            for row in rows:
                if row.get('spent', 0) > 0:
                    print(f"   Found spending in {row.get('subcategory_name')}: {row.get('spent')}")
            
            return True
        
        return False

    def test_dashboard_overview(self):
        """Test dashboard overview with real-time data"""
        print("\n=== Testing Dashboard Overview ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        success, dashboard_data = self.run_test(
            "Dashboard Overview",
            "GET",
            "dashboard/overview",
            200,
            params={"month": current_month, "days": 30},
            token=self.user_token
        )
        
        if success:
            income_total = dashboard_data.get('income_total', 0)
            expense_total = dashboard_data.get('expense_total', 0)
            net_total = dashboard_data.get('net_total', 0)
            
            print(f"✅ Dashboard data retrieved:")
            print(f"   Income: {income_total}")
            print(f"   Expense: {expense_total}")
            print(f"   Net: {net_total}")
            
            # Verify net calculation
            expected_net = income_total - expense_total
            if abs(net_total - expected_net) < 0.01:
                print(f"✅ Net calculation correct")
                return True
            else:
                print(f"❌ Net calculation incorrect: expected {expected_net}, got {net_total}")
        
        return False

    def test_user_isolation(self):
        """Test that users can only see their own data"""
        print("\n=== Testing User Data Isolation ===")
        
        # Admin tries to access user's payment methods (should see admin's own data)
        success, admin_pm = self.run_test(
            "Admin Payment Methods",
            "GET",
            "payment-methods",
            200,
            token=self.admin_token
        )
        
        # User tries to access their payment methods
        success2, user_pm = self.run_test(
            "User Payment Methods",
            "GET",
            "payment-methods",
            200,
            token=self.user_token
        )
        
        if success and success2:
            # Check that admin and user have different payment method IDs
            admin_ids = {pm['id'] for pm in admin_pm}
            user_ids = {pm['id'] for pm in user_pm}
            
            if admin_ids.isdisjoint(user_ids):
                print("✅ User data isolation working - no shared payment method IDs")
                return True
            else:
                print("❌ User data isolation failed - found shared payment method IDs")
                print(f"   Shared IDs: {admin_ids.intersection(user_ids)}")
        
        return False

    def test_admin_functionality(self):
        """Test admin-only functionality"""
        print("\n=== Testing Admin Functionality ===")
        
        # Test admin can list users
        success, users_data = self.run_test(
            "Admin List Users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        
        if success and len(users_data) >= 2:  # Should have admin + test user
            print(f"✅ Admin can list users: {len(users_data)} users found")
            
            # Test regular user cannot access admin endpoint
            success2, _ = self.run_test(
                "User Access Admin Endpoint (Should Fail)",
                "GET",
                "admin/users",
                403,  # Should be forbidden
                token=self.user_token
            )
            
            if success2:  # success2 means we got the expected 403
                print("✅ Regular user correctly denied admin access")
                return True
            else:
                print("❌ Regular user was able to access admin endpoint")
        
        return False

    def test_admin_page_access_control(self):
        """Test that only admin can access /app/admin page"""
        print("\n=== Testing Admin Page Access Control ===")
        
        # This will be tested in frontend, but we can verify the API access
        # The frontend should redirect non-admin users away from /app/admin
        
        # Verify admin role
        success, admin_profile = self.run_test(
            "Verify Admin Role",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        
        success2, user_profile = self.run_test(
            "Verify User Role",
            "GET",
            "auth/me",
            200,
            token=self.user_token
        )
        
        if success and success2:
            admin_role = admin_profile.get('role')
            user_role = user_profile.get('role')
            
            if admin_role == 'admin' and user_role == 'user':
                print("✅ Role verification working - admin has 'admin' role, user has 'user' role")
                return True
            else:
                print(f"❌ Role verification failed - admin: {admin_role}, user: {user_role}")
        
        return False

    def test_expense_report_data_endpoint(self):
        """Test expense report data API endpoint"""
        print("\n=== Testing Expense Report Data Endpoint ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        # Test with valid token
        success, report_data = self.run_test(
            "Expense Report Data",
            "GET",
            "reports/expenses/data",
            200,
            params={"month": current_month},
            token=self.user_token
        )
        
        if success:
            # Verify response structure
            required_fields = ['month', 'total', 'rows', 'totals_by_category']
            missing_fields = [field for field in required_fields if field not in report_data]
            
            if not missing_fields:
                print(f"✅ Report data structure correct")
                print(f"   Month: {report_data.get('month')}")
                print(f"   Total: {report_data.get('total')}")
                print(f"   Rows: {len(report_data.get('rows', []))}")
                print(f"   Category totals: {len(report_data.get('totals_by_category', []))}")
                
                # Test without token (should fail with 401)
                success2, _ = self.run_test(
                    "Expense Report Data (No Token)",
                    "GET",
                    "reports/expenses/data",
                    401,
                    params={"month": current_month}
                )
                
                if success2:
                    print("✅ Protected access working - 401 without token")
                    return True
                else:
                    print("❌ Protected access failed - should return 401 without token")
            else:
                print(f"❌ Missing required fields: {missing_fields}")
        
        return False

    def test_expense_report_pdf_endpoint(self):
        """Test expense report PDF export endpoint"""
        print("\n=== Testing Expense Report PDF Export ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        try:
            # Test PDF export
            url = f"{self.base_url}/api/reports/expenses/pdf"
            headers = {'Authorization': f'Bearer {self.user_token}'}
            params = {"month": current_month}
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                # Check content type
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type:
                    print("✅ PDF export successful - correct content type")
                    
                    # Check content disposition header
                    disposition = response.headers.get('content-disposition', '')
                    if 'attachment' in disposition and 'filename' in disposition:
                        print("✅ PDF has correct download headers")
                        
                        # Check file size (should be > 0)
                        if len(response.content) > 1000:  # PDF should be at least 1KB
                            print(f"✅ PDF file size reasonable: {len(response.content)} bytes")
                            
                            # Test without token
                            response_no_token = requests.get(url, params=params)
                            if response_no_token.status_code == 401:
                                print("✅ PDF export protected - 401 without token")
                                return True
                            else:
                                print(f"❌ PDF export not protected - got {response_no_token.status_code} without token")
                        else:
                            print(f"❌ PDF file too small: {len(response.content)} bytes")
                    else:
                        print(f"❌ PDF missing download headers: {disposition}")
                else:
                    print(f"❌ PDF wrong content type: {content_type}")
            else:
                print(f"❌ PDF export failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        
        except Exception as e:
            print(f"❌ PDF export error: {str(e)}")
        
        return False

    def test_expense_report_xlsx_endpoint(self):
        """Test expense report XLSX export endpoint"""
        print("\n=== Testing Expense Report XLSX Export ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        try:
            # Test XLSX export
            url = f"{self.base_url}/api/reports/expenses/xlsx"
            headers = {'Authorization': f'Bearer {self.user_token}'}
            params = {"month": current_month}
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                # Check content type
                content_type = response.headers.get('content-type', '')
                expected_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
                if expected_type in content_type:
                    print("✅ XLSX export successful - correct content type")
                    
                    # Check content disposition header
                    disposition = response.headers.get('content-disposition', '')
                    if 'attachment' in disposition and 'filename' in disposition:
                        print("✅ XLSX has correct download headers")
                        
                        # Check file size (should be > 0)
                        if len(response.content) > 1000:  # XLSX should be at least 1KB
                            print(f"✅ XLSX file size reasonable: {len(response.content)} bytes")
                            
                            # Test without token
                            response_no_token = requests.get(url, params=params)
                            if response_no_token.status_code == 401:
                                print("✅ XLSX export protected - 401 without token")
                                return True
                            else:
                                print(f"❌ XLSX export not protected - got {response_no_token.status_code} without token")
                        else:
                            print(f"❌ XLSX file too small: {len(response.content)} bytes")
                    else:
                        print(f"❌ XLSX missing download headers: {disposition}")
                else:
                    print(f"❌ XLSX wrong content type: {content_type}")
            else:
                print(f"❌ XLSX export failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        
        except Exception as e:
            print(f"❌ XLSX export error: {str(e)}")
        
        return False

    def test_expense_report_xlsx_year_endpoint(self):
        """Test expense report yearly XLSX export endpoint"""
        print("\n=== Testing Expense Report Yearly XLSX Export ===")
        
        current_year = date.today().year
        
        try:
            # Test yearly XLSX export
            url = f"{self.base_url}/api/reports/expenses/xlsx-year"
            headers = {'Authorization': f'Bearer {self.user_token}'}
            params = {"year": current_year}
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                # Check content type
                content_type = response.headers.get('content-type', '')
                expected_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
                if expected_type in content_type:
                    print("✅ Yearly XLSX export successful - correct content type")
                    
                    # Check content disposition header
                    disposition = response.headers.get('content-disposition', '')
                    if 'attachment' in disposition and 'filename' in disposition:
                        print("✅ Yearly XLSX has correct download headers")
                        
                        # Check file size (should be larger than single month)
                        if len(response.content) > 2000:  # Yearly XLSX should be larger
                            print(f"✅ Yearly XLSX file size reasonable: {len(response.content)} bytes")
                            
                            # Test without token
                            response_no_token = requests.get(url, params=params)
                            if response_no_token.status_code == 401:
                                print("✅ Yearly XLSX export protected - 401 without token")
                                return True
                            else:
                                print(f"❌ Yearly XLSX export not protected - got {response_no_token.status_code} without token")
                        else:
                            print(f"❌ Yearly XLSX file too small: {len(response.content)} bytes")
                    else:
                        print(f"❌ Yearly XLSX missing download headers: {disposition}")
                else:
                    print(f"❌ Yearly XLSX wrong content type: {content_type}")
            else:
                print(f"❌ Yearly XLSX export failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
        
        except Exception as e:
            print(f"❌ Yearly XLSX export error: {str(e)}")
        
        return False

    def test_expense_only_filtering(self):
        """Test that only expenses (not income) are included in reports"""
        print("\n=== Testing Expense-Only Filtering ===")
        
        current_month = date.today().strftime("%Y-%m")
        
        # Get report data
        success, report_data = self.run_test(
            "Get Report Data for Filtering Test",
            "GET",
            "reports/expenses/data",
            200,
            params={"month": current_month},
            token=self.user_token
        )
        
        if success and 'rows' in report_data:
            rows = report_data['rows']
            
            # Check that all transactions in report are expenses
            income_found = False
            for row in rows:
                # The report should only contain expense transactions
                # We can't directly check transaction type from the report,
                # but we can verify by checking if any income categories appear
                pass
            
            # Get all income categories to verify they don't appear in expense report
            success2, income_cats = self.run_test(
                "Get Income Categories",
                "GET",
                "categories",
                200,
                params={"kind": "income"},
                token=self.user_token
            )
            
            if success2:
                income_cat_ids = {cat['id'] for cat in income_cats}
                report_cat_ids = {row.get('category_id') for row in rows}
                
                # Check if any income category IDs appear in the expense report
                income_in_report = income_cat_ids.intersection(report_cat_ids)
                
                if not income_in_report:
                    print("✅ Expense-only filtering working - no income categories in expense report")
                    return True
                else:
                    print(f"❌ Income categories found in expense report: {income_in_report}")
            else:
                print("❌ Could not get income categories for filtering test")
        else:
            print("❌ Could not get report data for filtering test")
        
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Cerdas Finansial Backend API Tests")
        print(f"Testing against: {self.base_url}")
        
        test_results = []
        
        # Core authentication tests
        test_results.append(("Admin Login", self.test_admin_login()))
        test_results.append(("Admin Profile", self.test_admin_profile()))
        test_results.append(("User Registration", self.test_user_registration()))
        test_results.append(("Auto-seeded Data", self.test_auto_seeded_data()))
        
        # Transaction flow tests
        test_results.append(("Income Transaction Flow", self.test_income_transaction_flow()))
        test_results.append(("Expense Transaction Flow", self.test_expense_transaction_flow()))
        test_results.append(("Transaction Edit Flow", self.test_transaction_edit_flow()))
        test_results.append(("Transaction Delete Flow", self.test_transaction_delete_flow()))
        
        # Transfer and budget tests
        test_results.append(("Transfer Flow", self.test_transfer_flow()))
        test_results.append(("Budget Overview", self.test_budget_overview()))
        test_results.append(("Dashboard Overview", self.test_dashboard_overview()))
        
        # Security and isolation tests
        test_results.append(("User Data Isolation", self.test_user_isolation()))
        test_results.append(("Admin Functionality", self.test_admin_functionality()))
        test_results.append(("Admin Access Control", self.test_admin_page_access_control()))
        
        # New expense reporting tests
        test_results.append(("Expense Report Data API", self.test_expense_report_data_endpoint()))
        test_results.append(("Expense Report PDF Export", self.test_expense_report_pdf_endpoint()))
        test_results.append(("Expense Report XLSX Export", self.test_expense_report_xlsx_endpoint()))
        test_results.append(("Expense Report Yearly XLSX", self.test_expense_report_xlsx_year_endpoint()))
        test_results.append(("Expense-Only Filtering", self.test_expense_only_filtering()))
        
        # Print results
        print(f"\n📊 Test Results Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print(f"\n📋 Feature Test Results:")
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} {test_name}")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests Details:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CerdasFinansialTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())