import sys
import json
import difflib

# Ensure UTF-8 encoding for stdin/stdout on Windows
if sys.platform == 'win32':
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')

def check_similarity():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"score": 0, "most_similar": ""}))
            return

        data = json.loads(input_data)
        new_title = data.get('new_title', '').strip()
        existing_titles = data.get('existing_titles', [])

        if not new_title or not existing_titles:
            print(json.dumps({"score": 0, "most_similar": ""}))
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
            
            if len(similarities) > 0:
                max_score = max(similarities)
                most_similar_index = list(similarities).index(max_score)
                most_similar_title = existing_titles[most_similar_index]
                
                print(json.dumps({
                    "score": float(max_score),
                    "most_similar": most_similar_title
                }))
            else:
                print(json.dumps({"score": 0, "most_similar": ""}))

        except ImportError:
            # Fallback using difflib if scikit-learn is not installed
            max_score = 0
            most_similar_title = ""
            
            for title in existing_titles:
                # Simple string similarity
                score = difflib.SequenceMatcher(None, new_title.lower(), title.lower()).ratio()
                if score > max_score:
                    max_score = score
                    most_similar_title = title
            
            print(json.dumps({
                "score": float(max_score),
                "most_similar": most_similar_title,
                "note": "Using difflib fallback (scikit-learn not installed)"
            }))

    except Exception as e:
        print(json.dumps({"score": 0, "most_similar": "", "error": str(e)}))

if __name__ == "__main__":
    check_similarity()