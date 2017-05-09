import debugLogger from 'debug-logger';
const debug = debugLogger('app:github-service');

class StorageService {

  parsePullRequest(req) {
    let data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body;

    return data.pull_request.url;
  }

}

export default StorageService;
