import smtplib
EMAIL_ADDRESS = "lostandfoundgpmweb@gmail.com"
EMAIL_PASSWORD = "ogsi nqhd jgpk vyyw"
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.codec_options import CodecOptions


app = Flask(__name__)
CORS(app)



client = MongoClient(
    "mongodb://localhost:27017/",
    tz_aware=True
)

db = client["lost_found"].with_options(
    codec_options=CodecOptions(tz_aware=True)
)
users = db["users"]
found_items = db["found_items"]
lost_items = db["lost_items"]
activity_logs = db["activity_logs"]
pending_users = db["pending_users"]
admins = db["admins"]

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

def add_activity(email, activity):
    print("Saving Time:", datetime.now(ZoneInfo("Asia/Kolkata")))
    activity_logs.insert_one({

        "email": email,

        "activity": activity,

        "time": datetime.now(timezone.utc)

    })

def send_otp_email(receiver_email, otp):

    subject = "Lost & Found - Email Verification OTP"

    body = f"""
Hello,

Your OTP for Lost & Found Account Verification is:

{otp}

This OTP will expire in 5 minutes.

If you did not request this OTP, please ignore this email.

Regards,
Lost & Found Team
"""

    message = MIMEMultipart()
    message["From"] = EMAIL_ADDRESS
    message["To"] = receiver_email
    message["Subject"] = subject

    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(
            EMAIL_ADDRESS,
            receiver_email,
            message.as_string()
        )
        server.quit()

        return True

    except Exception as e:
        print("Email Error:", e)
        return False

@app.route("/")
def home():
    return "Server is running"

@app.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.json

    email = data.get("email").strip().lower()

    # Check if email already exists
    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered"}), 400

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Remove any previous pending registration
    pending_users.delete_many({"email": email})

    # Save user details with OTP
    pending_users.insert_one({
        "firstname": data.get("firstname"),
        "lastname": data.get("lastname"),
        "fullname": data.get("firstname") + " " + data.get("lastname"),
        "email": email,
        "phone": data.get("phone"),
        "studentid": data.get("studentid"),
        "department": data.get("department"),
        "password": data.get("password"),
        "otp": otp,
        "created_at": datetime.now(timezone.utc)
    })

    # Send Email
    if send_otp_email(email, otp):
        return jsonify({"message": "OTP sent successfully."})

    # If email sending fails
    pending_users.delete_one({"email": email})

    return jsonify({"message": "Failed to send OTP"}), 500



@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    print("VERIFY OTP CALLED")

    data = request.json

    email = data.get("email").strip().lower()
    otp = data.get("otp").strip()

    pending_user = pending_users.find_one({"email": email})

    if not pending_user:
        return jsonify({"message": "Registration session expired."}), 400

    if pending_user["otp"] != otp:
        return jsonify({"message": "Invalid OTP"}), 400

    users.insert_one({
        "firstname": pending_user["firstname"],
        "lastname": pending_user["lastname"],
        "fullname": pending_user["fullname"],
        "email": pending_user["email"],
        "phone": pending_user["phone"],
        "studentid": pending_user["studentid"],
        "department": pending_user["department"],
        "password": pending_user["password"]
    })

    pending_users.delete_one({"email": email})

    return jsonify({"message": "Account created successfully!"})


@app.route("/resend-otp", methods=["POST"])
def resend_otp():

    data = request.json

    email = data.get("email").strip().lower()

    pending_user = pending_users.find_one({"email": email})

    if not pending_user:
        return jsonify({"message": "Registration session expired."}), 400

    # Generate a new OTP
    new_otp = str(random.randint(100000, 999999))

    # Update OTP and reset timer
    pending_users.update_one(
        {"email": email},
        {
            "$set": {
                "otp": new_otp,
                "created_at": datetime.now(timezone.utc)
            }
        }
    )

    # Send the new OTP
    if send_otp_email(email, new_otp):
        return jsonify({"message": "New OTP sent successfully."})

    return jsonify({"message": "Failed to send OTP"}), 500

@app.route("/register", methods=["POST"])
def register():

    data = request.json

    firstname = data.get("firstname")
    lastname = data.get("lastname")
    email = data.get("email").strip().lower()
    phone = data.get("phone")
    studentid = data.get("studentid")
    department = data.get("department")
    password = data.get("password")

    if users.find_one({"email": email}):
        return jsonify({"message": "Email already registered"}), 400

    users.insert_one({
        "firstname": firstname,
        "lastname": lastname,
        "fullname": firstname + " " + lastname,
        "email": email,
        "phone": phone,
        "studentid": studentid,
        "department": department,
        "password": password
    })

    return jsonify({"message": "Registration Successful"})



@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    # ---------- Check Admin First ----------
    admin = admins.find_one({"email": email})

    if admin:

        if admin["password"] != password:
            return jsonify({"message": "Incorrect password"}), 401

        return jsonify({
            "message": "Admin login successful",
            "role": "admin",
            "user": {
                "fullname": admin["fullname"],
                "email": admin["email"]
            }
        }), 200

    # ---------- Check Normal User ----------
    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "Email not found"}), 404

    if str(user.get("password")) != password:
        return jsonify({"message": "Incorrect password"}), 401

    return jsonify({
        "message": "Login successful",
        "role": "user",
        "user": {
            "firstname": user["firstname"],
            "lastname": user["lastname"],
            "fullname": user["fullname"],
            "email": user["email"],
            "phone": user["phone"],
            "studentid": user["studentid"],
            "department": user["department"]
        }
    }), 200

@app.route("/update-profile", methods=["PUT"])
def update_profile():

    data = request.json

    email = data.get("email")
    role = data.get("role")

    # ---------- ADMIN ----------
    if role == "admin":

        admins.update_one(
            {"email": email},
            {
                "$set": {
                    "fullname": data.get("fullname"),
                    "email": data.get("email")
                }
            }
        )

        updated = admins.find_one({"email": email})

        return jsonify({

            "message": "Admin Profile Updated",

            "user": {

                "fullname": updated["fullname"],
                "email": updated["email"],
                "role": updated["role"]

            }

        })

    # ---------- STUDENT ----------

    users.update_one(

        {"email": email},

        {
            "$set": {

                "firstname": data.get("firstname"),

                "lastname": data.get("lastname"),

                "fullname": data.get("firstname") + " " + data.get("lastname"),

                "phone": data.get("phone")

            }
        }

    )

    add_activity(email, "Updated Profile")

    updated = users.find_one({"email": email})

    return jsonify({

        "message": "Profile Updated",

        "user": {

            "firstname": updated["firstname"],

            "lastname": updated["lastname"],

            "fullname": updated["fullname"],

            "email": updated["email"],

            "phone": updated["phone"],

            "studentid": updated["studentid"],

            "department": updated["department"]

        }

    })



@app.route("/change-password", methods=["PUT"])
def change_password():

    data = request.json

    email = data.get("email")
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    # ---------- Check Admin ----------
    admin = admins.find_one({"email": email})

    if admin:

        if admin["password"] != current_password:
            return jsonify({"message": "Current password is incorrect"}), 400

        admins.update_one(
            {"email": email},
            {
                "$set": {
                    "password": new_password
                }
            }
        )

        return jsonify({
            "message": "Admin password changed successfully"
        })

    # ---------- Check User ----------
    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user["password"] != current_password:
        return jsonify({"message": "Current password is incorrect"}), 400

    users.update_one(
        {"email": email},
        {
            "$set": {
                "password": new_password
            }
        }
    )

    add_activity(email, "Changed Password")

    return jsonify({
        "message": "Password changed successfully"
    })


@app.route("/found-item", methods=["POST"])
def found_item():

    data = request.json

    found_items.insert_one({

        "item_name": data.get("item_name"),

        "category": data.get("category"),

        "date_found": data.get("date_found"),

        "location_found": data.get("location_found"),

        "description": data.get("description"),

        "image": data.get("image"),

        "status": "Found"

    })
    add_activity(data.get("email"), "Reported Found Item")

    return jsonify({
        "message": "Found Item Submitted Successfully"
    })



@app.route("/lost-item", methods=["POST"])
def lost_item():

    data = request.json

    lost_items.insert_one({

        "item_name": data.get("item_name"),

        "category": data.get("category"),

        "date_lost": data.get("date_lost"),

        "location_lost": data.get("location_lost"),

        "description": data.get("description"),

        "image": data.get("image"),

        "status": "Lost"

    })
    add_activity(data.get("email"), "Reported Lost Item")

    return jsonify({
        "message": "Lost Item Submitted Successfully"
    })



@app.route("/quick-lost-item", methods=["POST"])
def quick_lost_item():

    data = request.json

    lost_items.insert_one({

        "item_name": data.get("item_name"),

        "category": "Not Specified",

        "date_lost": "",

        "location_lost": data.get("location_lost"),

        "description": data.get("description"),

        "image": "",

        "status": "Lost"

    })
    add_activity(data.get("email"), "Reported Quick Lost Item")

    return jsonify({
        "message": "Quick Lost Report Submitted Successfully"
    })



@app.route("/quick-found-item", methods=["POST"])
def quick_found_item():

    data = request.json

    found_items.insert_one({

        "item_name": data.get("item_name"),

        "category": "Not Specified",

        "date_found": "",

        "location_found": data.get("location_found"),

        "description": data.get("description"),

        "image": "",

        "status": "Found"

    })
    add_activity(data.get("email"), "Reported Quick Found Item")

    return jsonify({
        "message": "Quick Found Report Submitted Successfully"
    })



@app.route("/total-found-items", methods=["GET"])
def total_found_items():

    total = found_items.count_documents({})

    return jsonify({
        "total": total
    })



@app.route("/total-lost-items", methods=["GET"])
def total_lost_items():

    total = lost_items.count_documents({})

    return jsonify({
        "total": total
    })




@app.route("/recent-lost-items", methods=["GET"])
def recent_lost_items():

    items = []

    for item in lost_items.find().sort("_id", -1):

        items.append({

    "item_name": item["item_name"],

    "category": item.get("category", ""),

    "location_lost": item["location_lost"],

    "date_lost": item["date_lost"],

    "description": item.get("description", ""),

    "status": item["status"]

})

    return jsonify(items)



@app.route("/recent-activities")
def recent_activities():

    print("Recent Activities API Called")

    email = request.args.get("email")

    activities = []

    for activity in activity_logs.find({"email": email}).sort("time", -1).limit(10):
        print("Mongo Time:", activity["time"])

        activity["_id"] = str(activity["_id"])

        activity["time"] = activity["time"].isoformat()

        activities.append(activity)

    return jsonify(activities)




if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)
