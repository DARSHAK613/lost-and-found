import smtplib
import os
from dotenv import load_dotenv
load_dotenv()
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory
from difflib import SequenceMatcher
import re
def normalize_text(text):
    if not text:
        return ""

    text = str(text).lower().strip()
    text = re.sub(r"\s+", " ", text)

    return text

def text_similarity(text1, text2):
    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    if not text1 or not text2:
        return 0

    return SequenceMatcher(None, text1, text2).ratio()

def calculate_match_score(lost_item, found_item):
    name_score = text_similarity(
        lost_item.get("item_name"),
        found_item.get("item_name")
    )

    category_score = text_similarity(
        lost_item.get("category"),
        found_item.get("category")
    )

    description_score = text_similarity(
        lost_item.get("description"),
        found_item.get("description")
    )

    location_score = text_similarity(
        lost_item.get("location_lost"),
        found_item.get("location_found")
    )

    score = (
        name_score * 40 +
        category_score * 25 +
        description_score * 25 +
        location_score * 10
    )

    return round(score , 2)

def get_match_level(score):
    if score >= 80:
        return "Strong Match"
    elif score >= 60:
        return "Possible Match"
    else:
        return "Probably Not Match"

from flask_cors import CORS
from pymongo import MongoClient
from bson.codec_options import CodecOptions
from bson import ObjectId
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)



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
match_history = db["match_history"]
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
    

def send_account_status_email(receiver_email, fullname, status, reason="", note=""):

    if status == "blocked":
        subject = "Your Lost & Found Account Has Been Blocked"

        body = f"""
Hello {fullname},

Your Lost & Found account has been blocked by the administrator.

Reason:
{reason}

Additional Note:
{note if note else "No additional note."}

If you believe this is a mistake, please contact the administrator.

Regards,
Lost & Found Team
"""

    else:
        subject = "Your Lost & Found Account Has Been Reactivated"

        body = f"""
Hello {fullname},

Your account has been reactivated.

You can now log in again.

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
        "password": generate_password_hash(data.get("password")),
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

# Check OTP expiry (5 minutes)
    otp_age = datetime.now(timezone.utc) - pending_user["created_at"]

    if otp_age > timedelta(minutes=5):
        pending_users.delete_one({"email": email})
        return jsonify({"message": "OTP expired. Please request a new OTP."}), 400

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
        "password": pending_user["password"],

        "status": "active",
    "blocked_reason": "",
    "blocked_by": "",
    "blocked_date": ""
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

    stored_password = user.get("password", "")

    try:
        password_correct = check_password_hash(stored_password, password)
    except ValueError:
        password_correct = (stored_password == password)

    if not password_correct:
        return jsonify({"message": "Incorrect password"}), 401

    if user.get("status") == "blocked":
        return jsonify({
            "message": "Your account has been blocked. Please contact the administrator."
        }), 403
    
    if password_correct and stored_password == password:
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": generate_password_hash(password)}}
        )

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

    data = request.form

    image = request.files.get("image")
    filename = ""

    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    found_items.insert_one({

        "email": data.get("email"),

        "item_name": data.get("item_name"),

        "category": data.get("category"),

        "date_found": data.get("date_found"),

        "location_found": data.get("location_found"),

        "description": data.get("description"),

        "image": filename,

        "status": "Pending"

    })

    add_activity(data.get("email"), "Reported Found Item")

    return jsonify({
        "message": "Found Item Submitted Successfully"
    })


@app.route("/lost-item", methods=["POST"])
def lost_item():

    data = request.form

    image = request.files.get("image")
    filename = ""

    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

    lost_items.insert_one({

        "email": data.get("email"),

        "item_name": data.get("item_name"),

        "category": data.get("category"),

        "date_lost": data.get("date_lost"),

        "location_lost": data.get("location_lost"),

        "description": data.get("description"),

        "image": filename,

        "status": "Pending"

    })
    add_activity(data.get("email"), "Reported Lost Item")

    return jsonify({
        "message": "Lost Item Submitted Successfully"
    })



@app.route("/quick-lost-item", methods=["POST"])
def quick_lost_item():

    data = request.json

    lost_items.insert_one({

        "email": data.get("email"),

        "item_name": data.get("item_name"),

        "category": "Not Specified",

        "date_lost": "",

        "location_lost": data.get("location_lost"),

        "description": data.get("description"),

        "image": "",

        "status": "Pending"

    })
    add_activity(data.get("email"), "Reported Quick Lost Item")

    return jsonify({
        "message": "Quick Lost Report Submitted Successfully"
    })



@app.route("/quick-found-item", methods=["POST"])
def quick_found_item():

    data = request.json

    found_items.insert_one({

        "email": data.get("email"),

        "item_name": data.get("item_name"),

        "category": "Not Specified",

        "date_found": "",

        "location_found": data.get("location_found"),

        "description": data.get("description"),

        "image": "",

        "status": "Pending"

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

@app.route("/total-returned-items", methods=["GET"])
def total_returned_items():

    total = (
        found_items.count_documents({"status": "Returned"}) +
        lost_items.count_documents({"status": "Returned"})
    )

    return jsonify({
        "total": total
    })




@app.route("/recent-lost-items", methods=["GET"])
def recent_lost_items():

    items = []

    for item in lost_items.find({"status": "Approved"}).sort("_id", -1):

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

@app.route("/admin/users", methods=["GET"])
def get_all_users():

    # Students
    student_users = list(users.find({}, {"password": 0}))

    for user in student_users:
        user["_id"] = str(user["_id"])
        user["role"] = "user"

    # Admins
    admin_users = list(admins.find({}, {"password": 0}))

    for admin in admin_users:
        admin["_id"] = str(admin["_id"])
        admin["studentid"] = "*"
        admin["department"] = "*"
        admin["role"] = "admin"

    # Merge both
    all_users = student_users + admin_users

    return jsonify(all_users)


@app.route("/admin/block-user", methods=["POST"])
def block_user():

    data = request.json

    user_id = data["user_id"]
    reason = data["reason"]
    note = data["note"]

    user = users.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    email_sent = send_account_status_email(
    user["email"],
    user["fullname"],
    "blocked",
    reason,
    note
)

    print("Email Sent:", email_sent)
    print("Email Sent:", email_sent)

    users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "status": "blocked",
                "blocked_reason": reason,
                "blocked_by": "Administrator",
                "blocked_date": datetime.now().strftime("%d-%m-%Y"),
                "block_note": note
            }
        }
    )

    return jsonify({
        "success": True,
        "message": "User blocked successfully."
    })
@app.route("/admin/update-user", methods=["PUT"])
def admin_update_user():

    data = request.json

    user_id = data.get("user_id")
    fullname = data.get("fullname", "").strip()
    studentid = data.get("studentid", "").strip()
    phone = data.get("phone", "").strip()
    department = data.get("department", "").strip()
    role = data.get("role", "user")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "User ID is required."
        }), 400

    if not fullname:
        return jsonify({
            "success": False,
            "message": "Name cannot be empty."
        }), 400

    if role not in ["user", "admin"]:
        return jsonify({
            "success": False,
            "message": "Invalid role."
        }), 400

    try:
        object_id = ObjectId(user_id)
    except Exception:
        return jsonify({
            "success": False,
            "message": "Invalid user ID."
        }), 400

    # Find user in students collection
    user = users.find_one({"_id": object_id})

    # Find user in admins collection if not found in students
    admin = admins.find_one({"_id": object_id})

    if not user and not admin:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    current_role = "user" if user else "admin"

    # Split full name
    name_parts = fullname.split(" ", 1)

    firstname = name_parts[0]
    lastname = name_parts[1] if len(name_parts) > 1 else ""

    # --------------------------------
    # STUDENT → STUDENT
    # --------------------------------

    if current_role == "user" and role == "user":

        users.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "firstname": firstname,
                    "lastname": lastname,
                    "fullname": fullname,
                    "studentid": studentid,
                    "phone": phone,
                    "department": department
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "User updated successfully."
        })


    # --------------------------------
    # STUDENT → ADMINISTRATOR
    # --------------------------------

    if current_role == "user" and role == "admin":

        new_admin = {
            "fullname": fullname,
            "email": user["email"],
            "password": user["password"],
            "phone": phone,
            "status": user.get("status", "active")
        }

        admins.insert_one(new_admin)

        users.delete_one({
            "_id": object_id
        })

        return jsonify({
            "success": True,
            "message": "User role changed to Administrator successfully."
        })


    # --------------------------------
    # ADMINISTRATOR → ADMINISTRATOR
    # --------------------------------

    if current_role == "admin" and role == "admin":

        admins.update_one(
            {"_id": object_id},
            {
                "$set": {
                    "fullname": fullname,
                    "phone": phone
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "Administrator updated successfully."
        })


    # --------------------------------
    # ADMINISTRATOR → STUDENT
    # --------------------------------

    if current_role == "admin" and role == "user":

        new_user = {
            "firstname": firstname,
            "lastname": lastname,
            "fullname": fullname,
            "email": admin["email"],
            "phone": phone,
            "studentid": studentid,
            "department": department,
            "password": admin["password"],
            "status": admin.get("status", "active")
        }

        users.insert_one(new_user)

        admins.delete_one({
            "_id": object_id
        })

        return jsonify({
            "success": True,
            "message": "Administrator role changed to Student successfully."
        })

    return jsonify({
        "success": False,
        "message": "Unable to update role."
    }), 400
@app.route("/admin/unblock-user", methods=["POST"])
def unblock_user():

    print("UNBLOCK API CALLED")

    data = request.json

    user_id = data["user_id"]

    user = users.find_one({"_id": ObjectId(user_id)})

    if user:

        send_account_status_email(
        user["email"],
        user["fullname"],
        "active"
    )

    users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "status": "active",
                "blocked_reason": "",
                "blocked_by": "",
                "blocked_date": "",
                "block_note": ""
            }
        }
    )

    return jsonify({
        "success": True,
        "message": "User unblocked successfully."
    })


@app.route("/admin/reports", methods=["GET"])
def get_all_reports():

    reports = []

    # Lost reports
    for report in lost_items.find():

        report["_id"] = str(report["_id"])

        if report.get("matched_with"):
            report["matched_with"] = str(report["matched_with"])

        report["type"] = "Lost"

        user = users.find_one({"email": report.get("email")})

        if user:
            report["fullname"] = f'{user.get("firstname","")} {user.get("lastname","")}'
            report["studentid"] = user.get("studentid", "")
            report["department"] = user.get("department", "")
            report["phone"] = user.get("phone", "")

        reports.append(report)

    # Found reports
    for report in found_items.find():

        report["_id"] = str(report["_id"])

        if report.get("matched_with"):
            report["matched_with"] = str(report["matched_with"])
        report["type"] = "Found"

        user = users.find_one({"email": report.get("email")})

        if user:
            report["fullname"] = f'{user.get("firstname","")} {user.get("lastname","")}'
            report["studentid"] = user.get("studentid", "")
            report["department"] = user.get("department", "")
            report["phone"] = user.get("phone", "")

        reports.append(report)

    return jsonify(reports)

@app.route("/admin/matches", methods=["GET"])
def get_matches():
    matches = []

    approved_lost_items = list(
        lost_items.find({
            "status": "Approved",
            "matched": {"$ne": True}
        })
    )

    approved_found_items = list(
        found_items.find({
            "status": "Approved",
            "matched": {"$ne": True}
        })
    )

    for lost_item in approved_lost_items:
        for found_item in approved_found_items:

            score = calculate_match_score(
                lost_item,
                found_item
            )

            if score >= 60:
                matches.append({
                    "lost_id": str(lost_item["_id"]),
                    "found_id": str(found_item["_id"]),
                    "score": score,
                    "level": get_match_level(score),
                    "lost_item": lost_item.get("item_name", ""),
                    "found_item": found_item.get("item_name", ""),
                    "lost_category": lost_item.get("category", ""),
                    "found_category": found_item.get("category", ""),
                    "lost_description": lost_item.get("description", ""),
                    "found_description": found_item.get("description", ""),
                    "lost_location": lost_item.get("location_lost", ""),
                    "found_location": found_item.get("location_found", "")
                })

    matches.sort(
        key=lambda match: match["score"],
        reverse=True
    )

    return jsonify(matches)

@app.route("/admin/match-history", methods=["GET"])
def get_match_history():

    history = []

    for match in match_history.find().sort("_id", -1):

        lost_item = lost_items.find_one({
            "_id": match["lost_id"]
        })

        found_item = found_items.find_one({
            "_id": match["found_id"]
        })

        if not lost_item or not found_item:
            continue

        history.append({
            "history_id": str(match["_id"]),

            "lost_id": str(match["lost_id"]),
            "found_id": str(match["found_id"]),

            "lost_item": lost_item.get("item_name", ""),
            "found_item": found_item.get("item_name", ""),

            "status": match.get("status", "Confirmed"),

            "created_at": match.get("created_at").isoformat()
                if match.get("created_at") else ""
        })

    return jsonify(history)

@app.route("/admin/not-match", methods=["POST"])
def not_match():

    data = request.json

    lost_id = data.get("lost_id")
    found_id = data.get("found_id")
    history_id = data.get("history_id")

    if not lost_id or not found_id or not history_id:
        return jsonify({
            "success": False,
            "message": "Missing match information."
        }), 400

    try:
        lost_object_id = ObjectId(lost_id)
        found_object_id = ObjectId(found_id)
        history_object_id = ObjectId(history_id)

    except Exception:
        return jsonify({
            "success": False,
            "message": "Invalid match ID."
        }), 400

    lost_item = lost_items.find_one({
        "_id": lost_object_id
    })

    found_item = found_items.find_one({
        "_id": found_object_id
    })

    if not lost_item or not found_item:
        return jsonify({
            "success": False,
            "message": "Lost or found item not found."
        }), 404

    # Remove confirmed match from both reports
    lost_items.update_one(
        {"_id": lost_object_id},
        {
            "$set": {
                "matched": False
            },
            "$unset": {
                "matched_with": ""
            }
        }
    )

    found_items.update_one(
        {"_id": found_object_id},
        {
            "$set": {
                "matched": False
            },
            "$unset": {
                "matched_with": ""
            }
        }
    )

    # Remove from matching history
    match_history.delete_one({
        "_id": history_object_id
    })

    return jsonify({
        "success": True,
        "message": "Match removed successfully."
    })

@app.route("/admin/match/<lost_id>/<found_id>", methods=["GET"])
def get_match_details(lost_id, found_id):

    # Validate Lost ID
    try:
        lost_object_id = ObjectId(lost_id)
    except Exception:
        return jsonify({
            "message": "Invalid Lost report ID."
        }), 400

    # Validate Found ID
    try:
        found_object_id = ObjectId(found_id)
    except Exception:
        return jsonify({
            "message": "Invalid Found report ID."
        }), 400

    # Find Lost report
    lost_item = lost_items.find_one({
        "_id": lost_object_id
    })

    if not lost_item:
        return jsonify({
            "message": "Lost report not found."
        }), 404

    # Find Found report
    found_item = found_items.find_one({
        "_id": found_object_id
    })

    if not found_item:
        return jsonify({
            "message": "Found report not found."
        }), 404

    lost_item["_id"] = str(lost_item["_id"])
    found_item["_id"] = str(found_item["_id"])

    if "matched_with" in lost_item:
        lost_item["matched_with"] = str(lost_item["matched_with"])

    if "matched_with" in found_item:
        found_item["matched_with"] = str(found_item["matched_with"])

    # Find Lost reporter
    lost_user = users.find_one({
        "email": lost_item.get("email")
    })

    # Find Found reporter
    found_user = users.find_one({
        "email": found_item.get("email")
    })

    # Reporter information
    lost_reporter = {}
    if lost_user:
        lost_reporter = {
            "fullname": f'{lost_user.get("firstname", "")} {lost_user.get("lastname", "")}'.strip(),
            "studentid": lost_user.get("studentid", ""),
            "department": lost_user.get("department", ""),
            "phone": lost_user.get("phone", ""),
            "email": lost_user.get("email", "")
        }

    found_reporter = {}
    if found_user:
        found_reporter = {
            "fullname": f'{found_user.get("firstname", "")} {found_user.get("lastname", "")}'.strip(),
            "studentid": found_user.get("studentid", ""),
            "department": found_user.get("department", ""),
            "phone": found_user.get("phone", ""),
            "email": found_user.get("email", "")
        }

    # Convert MongoDB IDs to strings
    lost_item["_id"] = str(lost_item["_id"])
    found_item["_id"] = str(found_item["_id"])

    return jsonify({
        "lost_item": lost_item,
        "found_item": found_item,
        "lost_reporter": lost_reporter,
        "found_reporter": found_reporter
    })

@app.route("/admin/confirm-match", methods=["POST"])
def confirm_match():

    data = request.json

    lost_id = data.get("lost_id")
    found_id = data.get("found_id")
    match_history = db["match_history"]

    # Check IDs are provided
    if not lost_id or not found_id:
        return jsonify({
            "success": False,
            "message": "Lost ID and Found ID are required."
        }), 400

    # Validate Lost ID
    try:
        lost_object_id = ObjectId(lost_id)
    except Exception:
        return jsonify({
            "success": False,
            "message": "Invalid Lost report ID."
        }), 400

    # Validate Found ID
    try:
        found_object_id = ObjectId(found_id)
    except Exception:
        return jsonify({
            "success": False,
            "message": "Invalid Found report ID."
        }), 400

    # Find Lost report
    lost_item = lost_items.find_one({
        "_id": lost_object_id
    })

    if not lost_item:
        return jsonify({
            "success": False,
            "message": "Lost report not found."
        }), 404

    # Find Found report
    found_item = found_items.find_one({
        "_id": found_object_id
    })

    if not found_item:
        return jsonify({
            "success": False,
            "message": "Found report not found."
        }), 404

    # Both reports must be Approved
    if lost_item.get("status") != "Approved":
        return jsonify({
            "success": False,
            "message": "Lost report must be Approved before confirming the match."
        }), 400

    if found_item.get("status") != "Approved":
        return jsonify({
            "success": False,
            "message": "Found report must be Approved before confirming the match."
        }), 400

    # Prevent duplicate confirmation
    if lost_item.get("matched") is True:
        return jsonify({
            "success": False,
            "message": "This Lost report is already matched."
        }), 400

    if found_item.get("matched") is True:
        return jsonify({
            "success": False,
            "message": "This Found report is already matched."
        }), 400

    # Store the Lost ↔ Found relationship
    lost_items.update_one(
        {"_id": lost_object_id},
        {
            "$set": {
                "matched": True,
                "matched_with": found_object_id
            }
        }
    )

    found_items.update_one(
        {"_id": found_object_id},
        {
            "$set": {
                "matched": True,
                "matched_with": lost_object_id
            }
        }
    )
    match_history.insert_one({
        "lost_id": lost_object_id,
        "found_id": found_object_id,
        "status": "Confirmed",
        "created_at": datetime.now(timezone.utc)
    })

    return jsonify({
        "success": True,
        "message": "Match confirmed successfully."
    })
@app.route("/admin/approve-report", methods=["POST"])
def approve_report():

    data = request.json

    report_id = data.get("id")
    report_type = data.get("type")

    if report_type == "Lost":
        lost_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Approved"}}
        )

    elif report_type == "Found":
        found_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Approved"}}
        )

    return jsonify({
        "message": "Report Approved"
    })

@app.route("/admin/reject-report", methods=["POST"])
def reject_report():

    data = request.json

    report_id = data.get("id")
    report_type = data.get("type")

    if report_type == "Lost":
        lost_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Rejected"}}
        )

    elif report_type == "Found":
        found_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Rejected"}}
        )

    return jsonify({
        "message": "Report Rejected"
    })


@app.route("/admin/return-report", methods=["POST"])
def return_report():

    data = request.json

    report_id = data.get("id")
    report_type = data.get("type")

    if report_type == "Lost":
        lost_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Returned"}}
        )

    elif report_type == "Found":
        found_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Returned"}}
        )

    return jsonify({
        "message": "Item marked as Returned"
    })

@app.route("/admin/not-returned", methods=["POST"])
def not_returned():

    data = request.json

    report_id = data.get("id")
    report_type = data.get("type")

    if report_type == "Lost":
        lost_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Approved"}}
        )

    elif report_type == "Found":
        found_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Approved"}}
        )

    return jsonify({
        "message": "Item marked as Not Returned"
    })

@app.route("/admin/unreject-report", methods=["POST"])
def unreject_report():

    data = request.json

    report_id = data.get("id")
    report_type = data.get("type")

    if report_type == "Lost":
        lost_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Pending"}}
        )

    elif report_type == "Found":
        found_items.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": {"status": "Pending"}}
        )

    return jsonify({
        "message": "Report restored to Pending"
    })


@app.route("/admin/admin-count", methods=["GET"])
def admin_count():
    count = admins.count_documents({})
    return jsonify({"count": count})


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)
