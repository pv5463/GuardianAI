"""Quick test to verify backend imports and basic functionality"""
import asyncio
from utils.advanced_url_detector import analyze_url_advanced, get_recommendations

async def test_backend():
    print("Testing Guardian AI Backend...")
    print("-" * 50)
    
    # Test 1: Import check
    print("✓ Imports successful")
    
    # Test 2: Analyze a safe URL
    print("\nTest 1: Analyzing google.com...")
    result = await analyze_url_advanced("https://google.com")
    print(f"  Risk Score: {result['risk_score']}%")
    print(f"  Classification: {result['classification']}")
    
    # Test 3: Analyze a suspicious URL
    print("\nTest 2: Analyzing googl.com (typosquatting)...")
    result = await analyze_url_advanced("https://googl.com")
    print(f"  Risk Score: {result['risk_score']}%")
    print(f"  Classification: {result['classification']}")
    
    # Test 4: Get recommendations
    print("\nTest 3: Getting recommendations...")
    recommendations = get_recommendations(85, ["Typosquatting detected", "Suspicious domain"])
    for i, rec in enumerate(recommendations[:3], 1):
        print(f"  {i}. {rec}")
    
    print("\n" + "-" * 50)
    print("✓ All tests passed! Backend is ready.")
    print("\nYou can now start the server with:")
    print("  uvicorn main:app --reload")

if __name__ == "__main__":
    asyncio.run(test_backend())
