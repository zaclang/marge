import debugLogger from 'debug-logger';
const debug = debugLogger('app:github-service');

export default {

  parsePullRequest(req, res) {    
    let data = req.body.payload != null ? JSON.parse(req.body.payload) : req.body; 
    let room = 'testing';  
    let message = data.pull_request.url;

    if (typeof room !== 'string' || typeof message === 'undefined') {
      res.send(422); return;
    }

    // if (typeof message === 'string') {
    //   robot.messageRoom(room, message);
    // }

    res.send(message);     
  }
}
