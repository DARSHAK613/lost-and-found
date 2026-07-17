
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["lost_found"]
users = db["users"]
found_items = db["found_items"]
lost_items = db["lost_items"]

@app.route("/")
def home():
    return "Server is running"

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

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "Email not found"}), 404

    if str(user.get("password")) != password:
        return jsonify({"message": "Incorrect password"}), 401

    return jsonify({
        "message": "Login successful",
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

    for item in lost_items.find().sort("_id", -1).limit(5):

        items.append({

    "item_name": item["item_name"],

    "category": item.get("category", ""),

    "location_lost": item["location_lost"],

    "date_lost": item["date_lost"],

    "description": item.get("description", ""),

    "status": item["status"]

})

    return jsonify(items)

if __name__ == "__main__":
    app.run(debug=True)
