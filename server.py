import os
from livekit import api
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes and origins
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/getToken')
def getToken():
    # Check if required environment variables are set
    api_key = os.getenv('LIVEKIT_API_KEY')
    api_secret = os.getenv('LIVEKIT_API_SECRET')
    
    if not api_key or not api_secret:
        return jsonify({'error': 'Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET'}), 500
    
    try:
        token = api.AccessToken(api_key, api_secret) \
            .with_identity("identity") \
            .with_name("my name") \
            .with_grants(api.VideoGrants(
                room_join=True,
                room="my-room1",
            ))
        
        jwt_token = token.to_jwt()
        print(f"Generated token: {jwt_token}")
        return jsonify({'token': jwt_token})
    
    except Exception as e:
        print(f"Error generating token: {e}")
        return jsonify({'error': 'Failed to generate token'}), 500

@app.route('/getAdvancedToken', methods=['POST'])
def getAdvancedToken():
    """Create a token with advanced permissions and metadata"""
    api_key = os.getenv('LIVEKIT_API_KEY')
    api_secret = os.getenv('LIVEKIT_API_SECRET')
    
    if not api_key or not api_secret:
        return jsonify({'error': 'Missing API credentials'}), 500
    
    try:
        # Get parameters from request
        data = request.get_json() or {}
        identity = data.get('identity', 'user123')
        name = data.get('name', 'Anonymous')
        room = data.get('room', 'default-room')
        can_publish = data.get('can_publish', True)
        can_subscribe = data.get('can_subscribe', True)
        can_publish_data = data.get('can_publish_data', True)
        
        # Create token with advanced grants
        token = api.AccessToken(api_key, api_secret) \
            .with_identity(identity) \
            .with_name(name) \
            .with_metadata(data.get('metadata', '')) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room,
                room_admin=data.get('room_admin', False),
                room_create=data.get('room_create', False),
                can_publish=can_publish,
                can_subscribe=can_subscribe,
                can_publish_data=can_publish_data,
            ))
        
        # Set token expiration (optional)
        if data.get('ttl'):
            token.with_ttl(data['ttl'])
        
        jwt_token = token.to_jwt()
        return jsonify({
            'token': jwt_token,
            'identity': identity,
            'room': room,
            'permissions': {
                'can_publish': can_publish,
                'can_subscribe': can_subscribe,
                'can_publish_data': can_publish_data
            }
        })
    
    except Exception as e:
        print(f"Error generating advanced token: {e}")
        return jsonify({'error': 'Failed to generate token'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

