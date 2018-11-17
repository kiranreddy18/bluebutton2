export class OAuthAttributes {
    //------- AWS Beanstalk Deployment
    grant_type : string = 'authorization_code';
    redirect_uri : string = 'http://myelth-claims.s3-website-us-east-1.amazonaws.com/?';
    client_id : string = 'DyjoSUd5IpQs3P03l6s2uYRklkKnKCdd70OC8Pir';
    client_secret: string = 'gVH8WmiCau3bfxueRpnvf9T5nOUEN5T9HGvF1SZz0NmuqywqzSyvCOUhnEXMvygD7fBnSCzXWTKFAxh0I9komzR4j1Gowxh5tBF65jCs72Ptt9cuzOJVjxvdKV576G49';
    state : string = 'abc12df34gh5hjf63';    

    authorizeUrl : string = 'https://sandbox.bluebutton.cms.gov/v1/o/authorize/?client_id=DyjoSUd5IpQs3P03l6s2uYRklkKnKCdd70OC8Pir&redirect_uri=http://myelth-claims.s3-website-us-east-1.amazonaws.com/?&response_type=code&state=8e896a59f0744a8e93bf2f1f13230be6';

}

export class User {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;   
}

export class Address {
    district : number;
    postalCode : string;
    state : number;
}

export class Patient {
    id: number;
    firstName : string;
    middleInitial: string;
    lastName : string;
    birthDate : string;
    race : string;
    gender : string;
    address : Address;    
}

export class ClaimService {
    sequence : number;
    servicePeriodStart : string;
    servicePeriodEnd : string;
    categoryCode : number;
    categoryDisplay : string;
    serviceCode : string;
    quantity : number;

    deductibleAmount : number;
    submittedCharges : number;
    allowedCharges : number;
    providerPayment : number;
    coinsurance : number;
}

export class Claim {
    id : string;
    total : number;
    fundsReserve : number;
    billablePeriodStart : string;
    billablePeriodEnd : string;
    type : string;
    typeCode : string;
    typeCodeDisplay : string;
    status : string;
    primaryPayerAmount : number;
    deductibleAmount: number;
    providerPayAmount : number;
    benePayment : number;
    submittedCharges : number;
    allowedAmount : number;
    claimUrl : string;
    services : ClaimService[];
}

export class CoverageGroup {
    group : string;
    groupDisplay : string;
    subgroup : string;
    subgroupDisplay : string;
    plan : string;
    planDisplay : string;
    subplan : string;
    subplanDisplay : string;
    class : string;
    classDisplay : string;                
    subclass : string;
    subclassDisplay : string;                    
}

export class Coverage {
    id : number;
    status : string;
    period : string;
    groups : CoverageGroup[];
}



export class EOB {
  id: number;
  beneId: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  hcpcsCode: string;
  claimCount : number;

  selfClaimStartURL : string;
  nextClaimStartURL : string;
  prevClaimStartURL : string;
  lastClaimStartURL : string;
  firstClaimStartURL : string;
  claims : Claim[];
}

export class EOBTwo {
    id: number;
    beneId: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    hcpcsCode: string;
    billablePeriodStart1;
    billablePeriodEnd1;
    billablePeriodStart2;
    billablePeriodEnd2;
    billablePeriodStart3;
    billablePeriodEnd3;
    claimId1: string;
    claimId2: string;
    claimId3: string;
    claimType1: string;
    claimType2: string;
    claimType3: string;
    claimTypeCd1: string;
    claimTypeCd2: string;
    claimTypeCd3: string;
    claimTypeCdDisplay1: string;
    claimTypeCdDisplay2: string;
    claimTypeCdDisplay3: string;  
}

export class EOBDetail {
    id: number;
    beneId: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    claimId: string;
    claimStatus: string;
    claimType: string; 
    claimTypeCd: string;
    claimTypeCdDisplay: string;

    paymentAmount: number;
    provider: string;
    diagnosisPrimary: string;
    hcpcsCode: string;
    billablePeriodStart: string;
    billablePeriodEnd: string;
    adjudicationDisplay1: string;
    adjudicationAmount1: number;
    adjudicationDisplay1B: string;
    adjudicationAmount1B: number;
    adjudicationDisplay2: string;
    adjudicationAmount2: number;
    adjudicationDisplay2B: string;
    adjudicationAmount2B: number;


    nameArray: string[]
    itemHcpcsCode1: string;
    itemHcpcsCode2: string;
    itemMtusCode1: string;
    itemMtusCode2: string;
    itemBetosCodeDisplay1: string;
    itemBetosCodeDisplay2: string;
    itemBetosCode1: string;
    itemBetosCode2: string;
}
