# This directory stores chunk metadata exported from the Kaggle training notebook.
#
# After running training/Universal_AI_Document_Analyzer.ipynb:
#   1. Download the exported artifacts
#   2. Place the metadata pickle file here:
#      artifacts/metadata/chunks_metadata.pkl
#
# The backend loads this file to map FAISS index positions back to chunk text.
# DO NOT commit large pickle files to git.
