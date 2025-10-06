#!/usr/bin/env python3
"""
EduTheo System Test Script
Comprehensive testing of the complete EduTheo application
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

import httpx
import pytest


class EduTheoTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:8080"
        self.test_user = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "test123",
            "full_name": "Test User"
        }
        self.auth_token = None
        self.client = httpx.AsyncClient()

    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting EduTheo System Tests\n")
        
        tests = [
            ("Backend Health Check", self.test_backend_health),
            ("Frontend Availability", self.test_frontend_availability),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Questions API", self.test_questions_api),
            ("Analytics API", self.test_analytics_api),
            ("Practice Flow", self.test_practice_flow),
            ("Authentication Flow", self.test_auth_flow),
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"📋 Running: {test_name}")
            try:
                await test_func()
                print(f"✅ {test_name}: PASSED\n")
                results.append((test_name, "PASSED", None))
            except Exception as e:
                print(f"❌ {test_name}: FAILED - {str(e)}\n")
                results.append((test_name, "FAILED", str(e)))
        
        # Print summary
        self.print_test_summary(results)
        await self.client.aclose()

    async def test_backend_health(self):
        """Test backend health endpoint"""
        response = await self.client.get(f"{self.base_url}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    async def test_frontend_availability(self):
        """Test if frontend is accessible"""
        response = await self.client.get(self.frontend_url)
        assert response.status_code == 200
        assert "EduTheo" in response.text

    async def test_user_registration(self):
        """Test user registration"""
        # First, try to clean up any existing test user
        try:
            await self.client.delete(f"{self.base_url}/auth/user/{self.test_user['username']}")
        except:
            pass
        
        response = await self.client.post(
            f"{self.base_url}/auth/register",
            json=self.test_user
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == self.test_user["username"]

    async def test_user_login(self):
        """Test user login and token generation"""
        login_data = {
            "username": self.test_user["username"],
            "password": self.test_user["password"]
        }
        
        response = await self.client.post(
            f"{self.base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        self.auth_token = data["access_token"]

    async def test_questions_api(self):
        """Test questions API endpoints"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test get questions
        response = await self.client.get(f"{self.base_url}/questions/", headers=headers)
        assert response.status_code == 200
        questions = response.json()
        assert isinstance(questions, list)
        
        if questions:
            question = questions[0]
            # Test check answer
            answer_data = {
                "question_id": question["id"],
                "user_answer": "A",
                "is_correct": True,
                "time_spent": 10
            }
            response = await self.client.post(
                f"{self.base_url}/questions/check-answer",
                json=answer_data,
                headers=headers
            )
            assert response.status_code == 200

    async def test_analytics_api(self):
        """Test analytics API endpoints"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test user stats
        response = await self.client.get(f"{self.base_url}/analytics/stats", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        assert "total_questions" in stats

    async def test_practice_flow(self):
        """Test complete practice flow"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Get questions
        response = await self.client.get(
            f"{self.base_url}/questions/?limit=1",
            headers=headers
        )
        assert response.status_code == 200
        questions = response.json()
        
        if questions:
            question = questions[0]
            
            # Submit answer
            answer_data = {
                "question_id": question["id"],
                "user_answer": question["correct_answer"],
                "is_correct": True,
                "time_spent": 15
            }
            response = await self.client.post(
                f"{self.base_url}/questions/check-answer",
                json=answer_data,
                headers=headers
            )
            assert response.status_code == 200

    async def test_auth_flow(self):
        """Test authentication flow"""
        # Test accessing protected endpoint without token
        response = await self.client.get(f"{self.base_url}/analytics/stats")
        assert response.status_code == 401
        
        # Test with valid token
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        response = await self.client.get(f"{self.base_url}/analytics/stats", headers=headers)
        assert response.status_code == 200

    def print_test_summary(self, results):
        """Print test results summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for _, status, _ in results if status == "PASSED")
        failed = sum(1 for _, status, _ in results if status == "FAILED")
        
        print(f"Total Tests: {len(results)}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/len(results)*100):.1f}%")
        print()
        
        if failed > 0:
            print("Failed Tests:")
            for test_name, status, error in results:
                if status == "FAILED":
                    print(f"  ❌ {test_name}: {error}")
        else:
            print("🎉 All tests passed!")
        
        print("=" * 60)


def check_prerequisites():
    """Check if backend and frontend are running"""
    print("🔍 Checking prerequisites...")
    
    # Check backend
    try:
        import httpx
        client = httpx.Client()
        response = client.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 8000")
        else:
            print("❌ Backend is not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Backend is not running on port 8000: {e}")
        print("Please start the backend with: uvicorn main:app --reload")
        return False
    
    # Check frontend
    try:
        response = client.get("http://localhost:8080", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running on port 8080")
        else:
            print("❌ Frontend is not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Frontend is not running on port 8080: {e}")
        print("Please start the frontend with: python -m http.server 8080")
        return False
    finally:
        client.close()
    
    print("✅ All prerequisites met\n")
    return True


async def main():
    """Main test runner"""
    if not check_prerequisites():
        sys.exit(1)
    
    tester = EduTheoTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    # Install required packages if not available
    try:
        import httpx
    except ImportError:
        print("Installing required packages...")
        os.system("pip install httpx pytest pytest-asyncio")
        import httpx
    
    asyncio.run(main())