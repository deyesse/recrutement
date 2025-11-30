
export interface CandidateData {
  // Section I: Personal Info
  fullName: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  birthPlace: string;
  address: string;
  governorate: string;
  postalCode: string;
  cin: string;
  cinDate: string;
  socialSecurityType: 'cnss' | 'cnrps' | 'none' | '';
  cnssNumber: string;
  mobile: string;
  email: string;

  // Section II: Civil Status
  maritalStatus: string;
  militaryStatus: string;
  spouseName: string;
  spouseProfession: string;
  spouseWorkplace: string;
  childrenCount: string;

  // Section III: Education
  degree: string; // Stores the 'value' of the degree
  specialty: string;
  graduationYear: string;
  equivalenceDecision: string;
  equivalenceDate: string;
  
  // Bac Details
  bacAverage: string;
  bacSpecialty: string; // Stores the 'value' of the specialty
  bacYear: string;

  gradAverage: string;
  targetPositionNumber: string;
}

export const INITIAL_DATA: CandidateData = {
  fullName: '',
  gender: '',
  birthDate: '',
  birthPlace: '',
  address: '',
  governorate: '',
  postalCode: '',
  cin: '',
  cinDate: '',
  socialSecurityType: '',
  cnssNumber: '',
  mobile: '',
  email: '',
  maritalStatus: '',
  militaryStatus: '',
  spouseName: '',
  spouseProfession: '',
  spouseWorkplace: '',
  childrenCount: '',
  degree: '',
  specialty: '',
  graduationYear: '',
  equivalenceDecision: '',
  equivalenceDate: '',
  bacAverage: '',
  bacSpecialty: '',
  bacYear: '',
  gradAverage: '',
  targetPositionNumber: '',
};

export interface ListItem {
  value: string;
  label: string;
}

export const TUNISIAN_GOVERNORATES = [
  "أريانة", "باجة", "بن عروس", "بنزرت", "تطاوين", "توزر", "تونس", 
  "جندوبة", "زغوان", "سليانة", "سوسة", "سيدي بوزيد", "صفاقس", 
  "قابس", "قبلي", "قفصة", "القصرين", "القيروان", "الكاف", 
  "مدنين", "المنستير", "منوبة", "المهدية", "نابل"
];
