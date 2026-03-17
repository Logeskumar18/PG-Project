import sys
import json
import difflib
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Ensure UTF-8 encoding for stdin/stdout on Windows
if sys.platform == 'win32':
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def check_similarity():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"top_matches": []}))
            return

        data = json.loads(input_data)
        new_title = data.get('new_title', '').strip()
        existing_titles = data.get('existing_titles', [])
        
        # Fetch existing titles from MongoDB only if not provided in input
        if not existing_titles:
            try:
                mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/project_management')
                client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
                try:
                    db = client.get_database()
                except:
                    db = client['project_management']
                existing_titles = [doc.get('title') for doc in db.projects.find({}, {'title': 1}) if doc.get('title')]
            except Exception:
                pass

        if not new_title or not existing_titles:
            print(json.dumps({"top_matches": []}))
            return

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            # Combine titles for vectorization
            all_titles = existing_titles + [new_title]
            
            # Calculate TF-IDF and Cosine Similarity
            tfidf_vectorizer = TfidfVectorizer().fit_transform(all_titles)
            cosine_matrix = cosine_similarity(tfidf_vectorizer)
            
            # Compare new_title (last in list) with all existing titles
            # cosine_matrix[-1] is the row for new_title
            # We exclude the last element which is comparison with itself (1.0)
            similarities = cosine_matrix[-1][:-1]
            
            # Pair scores with titles
            results = []
            for i, score in enumerate(similarities):
                results.append({
                    "title": existing_titles[i],
                    "score": float(score)
                })
            
            # Sort by score descending and take top 3
            results.sort(key=lambda x: x["score"], reverse=True)
            print(json.dumps({"top_matches": results[:3]}))

        except ImportError:
            # Fallback using difflib if scikit-learn is not installed
            results = []
            
            for title in existing_titles:
                # Simple string similarity
                score = difflib.SequenceMatcher(None, new_title.lower(), title.lower()).ratio()
                results.append({
                    "title": title,
                    "score": float(score)
                })
            
            results.sort(key=lambda x: x["score"], reverse=True)
            print(json.dumps({
                "top_matches": results[:3],
                "note": "Using difflib fallback (scikit-learn not installed)"
            }))

    except Exception as e:
        print(json.dumps({"top_matches": [], "error": str(e)}))

if __name__ == "__main__":
    check_similarity()