class JobNotFoundError(Exception):
    def __init__(self, job_id: int, message: str = None):
        self.job_id = job_id
        self.message = message or f"Job with id {job_id} not found"
        super().__init__(self.message)

class CandidateNotFoundError(Exception):
    def __init__(self, candidate_id: str, message: str = None):
        self.candidate_id = candidate_id
        self.message = message or f"Candidate with id {candidate_id} not found"
        super().__init__(self.message)

class DuplicateCandidateError(Exception):
    def __init__(self, candidate_id: str, message: str = None):
        self.candidate_id = candidate_id
        self.message = message or f"Candidate with id {candidate_id} already exists"
        super().__init__(self.message)
