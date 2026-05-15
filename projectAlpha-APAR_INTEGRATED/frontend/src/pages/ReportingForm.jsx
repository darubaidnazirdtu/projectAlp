import React from "react"
import { Form } from "react-router-dom"
import { useState, useEffect, Children } from "react"
import Form_item from "../components/form_item"
import { useNavigate } from "react-router-dom"
import Response from "../components/response"
import CourseList from "../components/courselist"
import Loader from "../components/loader"
import Table from "../components/gethtml"
import Progress from "../components/progress"

import { Head2, Head3 } from "../components/heads"
function Form_area({ text, name }) {
    return <li className="label">
        <label>{text + " "}</label>
        <textarea name={name} style={{
            width: "25rem"
        }}></textarea>
    </li>
}

function Form_select({ text, name, values }) {
    let value_list = values.map((value) => {
        return <option value={value}>{value}</option>
    })
    return (<li className="label">
        <label>{text + " "}</label>
        <select name={name}>
            {value_list}
        </select>
    </li>)
}

function Grade_Select({ text, name }) {
    return <Form_select text={text} name={name} values={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}></Form_select>
}


export default function Form_({ Token }) {
    const [gradedResponse, setGradedResponse] = useState({})
    const [formView, setFormView] = useState(0);
    const [Fetched, setFetched] = useState(false);
    const [status, setStatus] = useState(null);
    const [formData, setFormData] = useState({
        ay: Token?.ay,
        title: Token?.title,
        designation: "Professor",
        caste: "Scheduled Caste(SC)",
        quality: "1",
        analytic_ability: "1",
        except_work: "1",
        work_done: "1",
        conduct: "1",
        r_and_p: "1",
        trust: "1",
        zeal: "1",
        duty: "1",
        knowledge: "1",
        published: "1",
        promotion: "1",
        general_assessment: "1",
        grading: "1",
        prof_knowledge: "1",
        strategic_planning: "1",
        decision_making: "1",
        coordination: "1",
        motivate_subs: "1",
        initiative: "1",
    });

    let research_json = []

    const navigate = useNavigate();
    useEffect(() => {
        async function fetchData() {
            let email = Token?.email;
            let password = Token?.password;
            let graded_id = Token?.graded_id;
            let role = Token?.title;
            let ay = Token?.ay
            let data = JSON.stringify({ email: email, password: password, graded_id: graded_id, role: role, ay: ay })
            let response = await fetch('http://localhost:3001/get_responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: data
            });
            response = await response.json();
            if (response.ok) {
                let data;
                if(response.data && response.data[0] && response.data[0].rows && response.data[0].rows.length){
                    data = response.data[0].rows[0]
                    data = {...data, exists : true}
                } else{
                    data = {exists : false}
                }
             
                setGradedResponse(data);
                setFetched(true);

                if(data.exists){
                    research_json = JSON.parse(data["research"])
                    console.log("research_json is : ")
                    console.log(research_json)
                }
            } else{
                console.log("the incorrect response included : ")
                console.log(response)
            }
        }
        fetchData();


    }, [Token])

    useEffect(() => {
        async function fetchStatus() {
            let get_status = await fetch(`http://localhost:3001/check_status?graded_id=${Token?.graded_id}&ay=${Token?.ay}`, {
                method: "GET",
            })

            get_status = await get_status.json()

            console.log("got status : ")
            console.log(get_status)

            if (get_status) {
                setStatus(get_status)
            }
        }

        fetchStatus()
    }, [])

    if (status && status.reviewing_finished === true) {
        navigate("/apar_download")
    }

    console.log("graded id is : ");
    console.log(Token?.graded_id)

    if (!Fetched) {
        return <Loader></Loader>
    }

    if (!gradedResponse.exists) return (<h2>graded officer has not filled the form</h2>)

    console.log("!!!!!!the gradedResponse is : ")
    console.log(gradedResponse)
    console.log("semiars is")
    console.log(gradedResponse.conference_seminar_workshops)


    const handleSubmit = async (event) => {
        event.preventDefault();
        let currentData = Object.fromEntries(new FormData(event.target));
        console.log("current data is: ")
        console.log(currentData)
        setFormData({
            ...formData,
            ...currentData
        })
        console.log("formData is")
        console.log(formData);
        if (1) {
            if (formView < 2) {
                console.log(formData);
                setFormView(formView + 1);
            } else if (window.confirm("Please confirm that you want to submit this form")) {
                let data = { ...formData };
                data = { ...data, ...currentData };
                console.log('Submitting all data:', data);
                let response = await fetch('http://localhost:3001/form_path/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: data, Token })
                });

                console.log("response received")
                console.log("raw response is : ")
                console.log(response)
                console.log(response.ok)

                if (response.ok) {
                    console.log("ok response");
                    console.log("attempting to go to the next page")
                    navigate("/submitted")
                } else {
                    alert(response.issue);
                }

            }
        }
    };

    let researchjson = JSON.parse(gradedResponse.research)


    const renderForm = () => {
        switch (formView) {
            case 0:
                return (
                    <>
                        <h2 style={{
                            marginTop: "1 rem !important",
                            fontFamily: "sans",
                            textAlign: "center",
                            color: "#00004B",
                            fontSize: "2rem",
                            fontWeight: "530",
                        }}>RESPONSES OF OFFICER BEING GRADED</h2>
                        <Form className="Form" style={{ width: "41rem !important" }}>

                            <h2 style={{
                                marginTop: "1 rem !important",
                                fontFamily: "sans",
                                textAlign: "center",
                                color: "#00004B",
                                fontSize: "2rem",
                                fontWeight: "530",
                            }}>PART I- PERSONAL DATA</h2>

                            <Response text={"1) Enter your name"} value={gradedResponse.name} />
                            <Response text={"2) Enter the name of the department"} value={gradedResponse.dept_name} />
                            <Response text={"3) Select the designation"} value={gradedResponse.designation} />

                            <Response text={"4) Enter your date of birth"} value={gradedResponse.dob} />
                            <Response text={"5) Enter the Academic Qualifications"} value={gradedResponse.academics} />
                            <Response text={"6) Enter your caste"} value={gradedResponse.caste} />
                            <Response text={"7) Date of continuous employment"} value={gradedResponse.date} type={"date"} />
                            <Response text={"8) Present Grade"} value={gradedResponse.grade} />
                            <Response text={"9) Period of absence from duty "} value={gradedResponse.period_of_absence} />

                            <h2 style={{
                                marginTop: "1 rem !important",
                                fontFamily: "sans",
                                textAlign: "center",
                                color: "#00004B",
                                fontSize: "2rem",
                                fontWeight: "530",
                            }}>PART II - SELF APPRAISAL</h2>

                            <Response text={"1) Brief description of your duties"} value={gradedResponse.duties} />

                            <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontWeight: "550" }} className="label">
                                2) Teaching at UG and PG Levels
                            </label>


                            {
                                gradedResponse.courses &&
                                <Table text="i) Courses taught at various levels" key={-1} table={JSON.parse(gradedResponse.courses)}></Table>
                            }

                            <fieldset>
                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">
                                    ii) Total of hours/ periods provided in the time table for
                                </label>
                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", fontWeight: "550" }} className="label">

                                    a) Lectures, Tutorials, Practical, Seminars/ Discussions in the academic year
                                </label>
                                <Response text={"For odd semester"} value={gradedResponse.total_hours_odd} />
                                <Response text={"For even semester"} value={gradedResponse.total_hours_even} />
                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", fontWeight: "550" }} className="label">
                                    b) the number actually taken during the academic year
                                </label>
                                <Response text={"For odd semester"} value={gradedResponse.taken_hours_odd} />
                                <Response text={"For even semester"} value={gradedResponse.taken_hours_even} />
                            </fieldset>

                            <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">
                                iii) Work load per week
                            </label>
                            <fieldset>
                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">
                                    For odd semester
                                </label>
                                <Response text={"Lectures"} value={gradedResponse.lectures_odd} />
                                <Response text={"Tutorials"} value={gradedResponse.tutorials_odd} />
                                <Response text={"Practicals"} value={gradedResponse.practicals_odd} />
                                <Response text={"Seminars/Group Discussions"} value={gradedResponse.s_gds_odd} />
                            </fieldset>

                            <fieldset>
                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">
                                    For even semester
                                </label>
                                <Response text={"Lectures"} value={gradedResponse.lectures_even} />
                                <Response text={"Tutorials"} value={gradedResponse.tutorials_even} />
                                <Response text={"Practicals"} value={gradedResponse.practicals_even} />
                                <Response text={"Seminars/Group Discussions"} value={gradedResponse.s_gds_even} />
                            </fieldset>

                            <Response text={"3) Details of teaching methods employed by you: (Lectures, Tutorials, Seminars, Practicals etc.)"} value={gradedResponse.details_of_teaching} />
                            <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">4) a) Details of Tutorials/ tests held during the academic year</label>

                            <fieldset>

                                <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">Under-graduate Courses (Odd Semester)</label>

                                <Response text={"Number of tests held (odd semester)"} value={gradedResponse.test_ug_odd} />
                                <Response text={"Assignment checked (odd semester)"} value={gradedResponse.assignment_ug_odd} />

                                <h3 style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">Under-graduate Courses (Even Semester)</h3>

                                <Response text={"Number of tests held (even semester)"} value={gradedResponse.test_ug_even} />
                                <Response text={"Assignment checked (even semester"} value={gradedResponse.assignment_ug_even} />
                            </fieldset>

                            <fieldset>
                                <h3 style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">Post-graduate Courses (Odd Semester)</h3>
                                <Response text={"Number of tests held (odd semester)"} value={gradedResponse.test_pg_odd} />
                                <Response text={"Assignment checked (odd semester"} value={gradedResponse.assignment_pg_odd} />

                                <h3 style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", color: "#00005B", fontWeight: "550" }} className="label">Post-graduate Courses (Even Semester)</h3>
                                <Response text={"Number of tests held (even semester)"} value={gradedResponse.test_pg_even} />
                                <Response text={"Assignment checked (even semester"} value={gradedResponse.assignment_pg_even} />
                            </fieldset>



                            <Response text={"b) Details of academic planning/ presentation of lectures during the session: Please give specific details"} value={gradedResponse.details_of_planning} />

                            <h2 style={{
                                marginTop: "1 rem !important",
                                fontFamily: "sans",
                                textAlign: "center",
                                color: "#00004B",
                                fontSize: "2rem",
                                fontWeight: "530",
                            }}>PART III - RESEARCH & DEVELOPMENT, CONTINUING EDUCATION AND INTERACTION WITH THE INDUSTRIES & PROFESSIONAL SOCIETIES</h2>



                            {

                                gradedResponse.research &&
                                <Table text={"1) a) Details of published/ research papers in reputed journals, books,    monographs, reviews chapter in books, translations & creative writing etc. if any during period under review"} table={JSON.parse(gradedResponse.research)} key={1}></Table>
                            }


                            {
                                gradedResponse.editing &&
                                <Table text={"1) b) Details of editing learned journals and proceedings:"} table={JSON.parse(gradedResponse.editing)} key={2} />
                            }

                            {
                                gradedResponse.conference_seminar_workshops &&
                                <Table text={"2) Participation in Conferences, Seminars, Workshops: Give details of the papers presented and/ or official's position held"} table={JSON.parse(gradedResponse.conference_seminar_workshops)} />
                            }





                            <Response text={"3) Summer institutes, refresher or orientation courses attended or conducted. Give details"} value={gradedResponse.orientation_courses} />

                            <label style={{ marginBottom: '0.5rem', width: 'fit-content', fontSize: "1rem !important", fontWeight: "550" }} className="label">4) Details of Guidance for: </label>

                            <Response text={"i) U.G. and P.G. Project Guidance"} value={gradedResponse.ug_pg_guidance} />

                            <Response text={"ii) Ph.D Guidance"} value={gradedResponse.phd_guidance} />

                            <Response text={"iii) Research Guidance"} value={gradedResponse.research_guidance} />

                            <Response text={"5) Details of industrial interaction/professional consultancy/patent obtained or applied for"} value={gradedResponse.interactions} />

                            <Response text={"6) Membership or fellowship of professional/academic Bodies, Societies etc. give details"} value={gradedResponse.membership_fellowship} />

                            <Response text={"7) Any other information regarding academic activities not covered"} value={gradedResponse.other_activities} />

                            <h2 style={{
                                marginTop: "1 rem !important",
                                fontFamily: "sans",
                                textAlign: "center",
                                color: "#00004B",
                                fontSize: "2rem",
                                fontWeight: "530",
                            }}>PART IV - CONTRIBUTION TO INSTITUTE CORPORATE LIFE</h2>

                            <fieldset>
                                <Response text={"1) a) Curriculum Development"} value={gradedResponse.curriculumn_development} key="3" />
                                <Response text={"1) b) Details of courses development/ revised"} value={gradedResponse.course_development} key="4" />
                            </fieldset>

                            <h3>Laboratory Development and experimental set up</h3>
                            <Response text={"2) Laboratory Development and experimental set up"} key="5" value={gradedResponse.lab_prep} />

                            <fieldset>
                                <Response text={"3) a) Cultural/extracurricular activities"} value={gradedResponse.cultural_activity} key="6" />
                                <Response text={"3) b) Sports/Community and Extension services/ N.S.S"} value={gradedResponse.sports} key="7" />
                                <Response text={"3) c) Administrative Assignment"} value={gradedResponse.administration} key="8" />
                                <Response text={"3) d) Any other"} value={gradedResponse.other_activity} key="9" />
                            </fieldset>

                            <button className="submitButton" onClick={() => setFormView(1)}>Next{" >>"}</button>

                        </Form >
                    </>
                )

            case 1:
                return (
                    <Form className="Form" onSubmit={handleSubmit}>
                        <Head2>DETAILS OF REPORTING OFFICER</Head2>
                        <input type="hidden" value={Token.graded_id} name="graded_id"></input>
                        <input type="hidden" value={Token.faculty_id} name="faculty_id"></input>
                        <input type="hidden" name="ay" value={Token.ay}></input>
                        <input type="hidden" name="title" value={Token.title}></input>
                        <Form_item text={"1) Enter your name"} name={"reporting_officer_name"}></Form_item>

                        <li className="label"> <label> 2) Select the designation {"   "}</label>
                            <select name="designation" style={{ width: "26rem", fontSize: "1rem" }}>
                                <option value={"Professor"}  >Professor</option>
                                <option value={"Associate Professor"}>Associate Professor</option>
                                <option value={"Assistant Professor"}>Assistant Professor</option>
                            </select>
                        </li>

                        <Head3>Numerical Assessment (Grade on a scale from 1-10)</Head3>
                        <h3>A) Assessment of work output (40% weightage) </h3>
                        <fieldset>
                            <Grade_Select text={"1) Accomplishment of planned work/work allotted as per subjects allotted."} name={"accomplishment"}></Grade_Select>

                            <Grade_Select text={"2) Quality of output"} name={"quality"}></Grade_Select>

                            <Grade_Select text={"3) Analytical ability"} name={"analytic_ability"}></Grade_Select>

                            <Grade_Select text={"4) Accomplishment of exceptional work/Unforeseen tasks performed."} name={"except_work"}></Grade_Select>
                        </fieldset>

                        <h3>B)  Assessment of Personal attributes (30% weightage) </h3>

                        <fieldset>
                            <Grade_Select text={"1) Has the officer show himself able to do the work of his appointment. "} name={"work_done"}></Grade_Select>

                            <Grade_Select text={"2) Conduct"} name={"conduct"}></Grade_Select>

                            <Grade_Select text={"3) Regularity and Punctuality"} name={"r_and_p"}></Grade_Select>

                            <Grade_Select text={"4) Trustworthiness"} name={"trust"}></Grade_Select>

                            <Grade_Select text={"5) Zeal"} name={"zeal"}></Grade_Select>

                            <Grade_Select text={"6) Performance of duties"} name={"duty"}></Grade_Select>

                            <Grade_Select text={"7) a) Knowledge of the branch on which engaged and quality of work \nb) Ability to manage the class and maintain discipline among the students"} name={"knowledge"}></Grade_Select>

                            <Grade_Select text={"8) Has the officer published any original papers or conducted any research during the year under report or otherwise in any manner done distinguished work."} name={"published"}></Grade_Select>

                            <Grade_Select text={"9) Fitness for promotion to the higher grade and for further advancement."} name={"promotion"}></Grade_Select>

                            <Grade_Select text={"10) General assessment taking all the above points into consideration (of personality, integrity and temperament including relations with fellow members of staff."} name={"general_assessment"}></Grade_Select>

                            <Grade_Select text={"11) Grading (Outstanding/ Very Good/ Good/ Average/ Below Average) "} name={"grading"}></Grade_Select>
                        </fieldset>

                        <h3>C)Assessment of Functional Competency (30% weightage)</h3>

                        <fieldset>
                            <Grade_Select text={"1) Professional knowledge in the area of function."} name={"prof_knowledge"}></Grade_Select>

                            <Grade_Select text={"2) Strategic Planning ability"} name={"strategic_planning"}></Grade_Select>

                            <Grade_Select text={"3) Decision making ability"} name={"decision_making"}></Grade_Select>

                            <Grade_Select text={"4) Coordination ability"} name={"coordination"}></Grade_Select>

                            <Grade_Select text={"5) Ability to motivate and develop subordinates."} name={"motivate_subs"}></Grade_Select>

                            <Grade_Select text={"6) Initiative"} name={"initiative"}></Grade_Select>
                        </fieldset>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button onClick={() => { setFormView(0) }} className="submitButton" style={{ backgroundColor: '#e1e1e1', color: 'black' }}>{"<< "}Previous</button>
                            <div style={{ width: '100px' }}></div>
                            <button className="submitButton" type="submit" >Next{" >>"}</button>
                        </div>
                    </Form>
                )

            case 2:
                return (
                    <Form className="Form" onSubmit={handleSubmit}>
                        <Head3>GENERAL</Head3>

                        <fieldset>
                            <Form_area text={"1) Relations with the public (wherever applicable)"} name={"public_relations"}></Form_area>

                            <Form_area text={"2) Training"} name={"training"}></Form_area>

                            <Form_area text={"3) State of Health"} name={"health"}></Form_area>

                            <Form_area text={"4) Integrity"} name={"Integrity"}></Form_area>

                            <Form_area text={"5) Pen Picture by Reporting Officer (about 100 words) on the overall qualities of the officer including area of strengths and lesser strength, extraordinary achievements, significant failures (ref: 3(A) & 3(B) of Part-2) and attitude towards weaker sections."} name={"pen_picture"}></Form_area>
                        </fieldset>

                        <Form_item text={"I certify that the information’s given above are correct and factual to the best of my knowledge"} name={"certified"} type="checkbox"></Form_item>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button onClick={(e) => { e.preventDefault(); setFormView(1) }} className="submitButton" style={{ backgroundColor: '#e1e1e1', color: 'black' }}>{"<< "}Previous</button>
                            <div style={{ width: '100px' }}></div>
                            <button className="submitButton">Submit Form</button>
                        </div>




                    </Form>
                )
        }
    }

    return (
        <>
            {window.scrollTo(0, 0)}
            <h2 className="title" style={{
                marginTop: "1.5 rem !important",
                fontFamily: "sans",
                color: "#00004B",
                fontSize: "2.4rem",
                fontWeight: "530",
            }}>Annual Performance Assessment Report Form</h2>

            <Progress stepList={["Preview", "Details", "General"]} completed_ix={formView - 1} setFormView={setFormView} />

            <div className="form-switcher">
                <button className={`circle-button ${formView === 0 ? 'active' : ''}`} onClick={() => setFormView(0)}></button>
                <button className={`circle-button ${formView === 1 ? 'active' : ''}`} onClick={() => setFormView(1)}></button>
                <button className={`circle-button ${formView === 2 ? 'active' : ''}`} onClick={() => setFormView(2)}></button>
            </div>
            {renderForm()}

            <style jsx>{`
                .form-switcher {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                    padding-top: 20px;
                }
                .circle-button {
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background-color: lightblue;
                    border: none;
                    margin: 0 5px;
                    cursor: pointer;
                }
                .circle-button:hover {
                    background-color: deepskyblue;
                }
                .circle-button.active {
                    background-color: #009dff;
                }
                .Form {
                    margin-top: 10px;
                }
            `}</style>
        </>
    )
}
