const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeEditorPage.tsx', 'utf8');

const t_target = `              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Bachelor of Science"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'fieldOfStudy', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="Computer Science"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="University Name"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'graduationYear', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    placeholder="2022"
                  />
                </div>
              </div>`;

const t_replacement = `              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Education Level</label>
                  <select
                    value={edu.level || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'level', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select Level</option>
                    <option value="10th / Secondary">10th / Secondary</option>
                    <option value="12th / Intermediate">12th / Intermediate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Degree / Qualification</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Bachelor of Technology"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization / Stream</label>
                  <input
                    type="text"
                    value={edu.specialization || edu.fieldOfStudy || ''}
                    onChange={(e) => {
                      handleEducationChange(eduIdx, 'specialization', e.target.value);
                      handleEducationChange(eduIdx, 'fieldOfStudy', e.target.value);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={edu.location || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'location', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Board / University</label>
                  <input
                    type="text"
                    value={edu.board || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'board', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Year</label>
                  <input
                    type="text"
                    value={edu.startDate || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'startDate', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Year</label>
                  <input
                    type="text"
                    value={edu.endDate || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'endDate', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'graduationYear', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CGPA</label>
                  <input
                    type="text"
                    value={edu.cgpa || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'cgpa', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Percentage</label>
                  <input
                    type="text"
                    value={edu.percentage || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'percentage', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks Obtained / Total</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={edu.marksObtained || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'marksObtained', e.target.value)}
                      className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 560"
                    />
                    <input
                      type="text"
                      value={edu.totalMarks || ''}
                      onChange={(e) => handleEducationChange(eduIdx, 'totalMarks', e.target.value)}
                      className="w-1/2 p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 600"
                    />
                  </div>
                </div>
              </div>`;

code = code.replace(t_target, t_replacement);
fs.writeFileSync('src/components/ResumeEditorPage.tsx', code);
