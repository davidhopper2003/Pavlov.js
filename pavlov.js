function countSteps(observation,reward){
  stepReward = reward/observation.length;

  observation.forEach(function(step,i){
    //initialization
    R_[step.state] = R_[step.state] || {reward:0, count:0};
    P_[step.state] = P_[step.state] || {};
    P_[step.state][step.action] = P_[step.state][step.action] || {};

    //increment total reward count
    R_[step.state].reward += stepReward;
    R_[step.state].count += 1;
    //and visit count
    if (i < observation.length - 1) P_[step.state][step.action][observation[i+1].state] = P_[step.state][step.action][observation[i+1].state] + 1 || 1;
  });
};

function getRewardsFromCount(R_){
  var R = {};
  Object.keys(R_).forEach(function(state){
    R[state] = R_[state].reward / R_[state].count;
  });
  return R;
};

function getTransProbsFromCount(P_){
  Object.keys(P_).forEach(function(state){
    Object.keys(P_[state]).forEach(function(action){
      var visitCount = Object.keys(P_[state][action]).reduce(function(sum,state_){
        return sum + P_[state][action][state_];
      },0);
      Object.keys(P_[state][action]).forEach(function(state_){
        P_[state][action][state_] = P_[state][action][state_] / visitCount;
      });
    });
  });
  return P_;
};

function makeMDP(observations,rewards){
  P_ = {};
  R_ = {};

  observations.forEach(function(observation,i){
    countSteps(observation,rewards[i]);
  });

  var R = getRewardsFromCount(R_);
  var P = getTransProbsFromCount(P_);

  console.log("R: ", R, "P: ",P)
  return [P,R];
};

function checkConverge(V,V_){
  var totalDif = 0;
  var totalOld = 0;
  Object.keys(V).forEach(function(state){
    totalDif += Math.abs(V[state] - V_[state]);
    totalOld += Math.abs(V_[state]);
  });
  return (totalDif < 0.001*totalOld)
};

function copyObj(obj){
  var obj_ = {};
  Object.keys(obj).forEach(function(key){
    obj_[key] = obj[key];
  });
  return obj_;
};

function policyFormatted(P,R){
  var policy = {}
  var V = {};
  Object.keys(R).forEach(function(state){
    V[state] = 0;
  });

  var val;
  var notConverged = true;
  while (notConverged){
    var V_ = copyObj(V);
    Object.keys(P).forEach(function(state){
      var futureVal = -Infinity;
      Object.keys(P[state]).forEach(function(action){
        val = 0;
        Object.keys(P[state][action]).forEach(function(state_){
          val += (P[state][action][state_] * V[state_]);
        });
        if (val > futureVal){
          futureVal = val;
          policy[state] = action;
        }
        V[state] = R[state] + futureVal;
      });
    });
    notConverged = !checkConverge(V,V_);
  };
  return policy;
};

var policy = module.exports.policy = function(observations, rewards){
  var MDP = makeMDP(observations, rewards);
  return policyFormatted(MDP[0], MDP[1]);
};
