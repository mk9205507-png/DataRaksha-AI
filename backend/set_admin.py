import sys
import asyncio
from app.services.supabase_service import supabase_service

async def promote_user_to_admin(email: str):
    clean_email = email.strip().lower()
    if not clean_email:
        print("Error: Please provide a valid user email address.")
        print("Usage: python set_admin.py <user_email>")
        return

    print(f"Assigning administrator role to: '{clean_email}'...")

    # 1. Update in-memory mock store
    found_in_mock = False
    for uid, prof in supabase_service._mock_profiles.items():
        if (prof.get("email") or "").lower() == clean_email:
            prof["role"] = "admin"
            found_in_mock = True
            print(f"[OK] Updated local mock profile for {clean_email} (ID: {uid}) to 'admin'.")

    if not found_in_mock:
        new_id = f"admin-{clean_email.replace('@', '-').replace('.', '-')}"
        supabase_service._mock_profiles[new_id] = {
            "id": new_id,
            "email": clean_email,
            "role": "admin",
            "created_at": "2026-01-01T00:00:00Z",
        }
        print(f"[OK] Created local admin profile for {clean_email} (ID: {new_id}).")

    # 2. Update Supabase PostgreSQL database
    client = supabase_service.db_client
    if client:
        try:
            res = client.table("profiles").update({"role": "admin"}).eq("email", clean_email).execute()
            if res.data and len(res.data) > 0:
                print(f"[OK] Successfully updated Supabase database profiles record for '{clean_email}' to role='admin'!")
            else:
                print(f"Note: User '{clean_email}' was not found in public.profiles yet.")
                print(f"If you signed up recently, ensure you confirmed your account, then run:")
                print(f"  UPDATE public.profiles SET role = 'admin' WHERE email = '{clean_email}';")
        except Exception as e:
            print(f"Supabase database note: {e}")
            print(f"To update directly in Supabase SQL Editor:")
            print(f"  UPDATE public.profiles SET role = 'admin' WHERE email = '{clean_email}';")

    print("\nDone! Log in with this account or refresh your browser at: http://localhost:5173/#admin")

if __name__ == "__main__":
    target_email = sys.argv[1] if len(sys.argv) > 1 else ""
    if not target_email:
        print("Usage: python set_admin.py <your_email>")
        print("Example: python set_admin.py kalyani@dataraksha.ai")
    else:
        asyncio.run(promote_user_to_admin(target_email))
