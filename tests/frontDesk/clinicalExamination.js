"use strict";
const {
    click,
    waitFor,
    timeField,
    toRightOf,
    textBox,
    into,
    write,
    dropDown,
    highlight,
    below,
    within,
    scrollTo,
    $,
    text,
    confirm,
    accept,
    button,
    link,
    above,
    evaluate
} = require('taiko');
var fileExtension = require("../util/fileExtension");
const taikoHelper = require("../util/taikoHelper");
var date = require("../util/date");
var assert = require("assert");

step("Doctor prescribe tests <prescriptions>", async function (labOrderNames) {
    var labOrderList = labOrderNames.split(',')
    var labOrderCount = labOrderList.length
    gauge.dataStore.scenarioStore.put("labOrderCount", labOrderCount)
    for (var i = 0; i < labOrderCount; i++) {
        var labOrderFile = `./bahmni-e2e-common-flows/data/${labOrderList[i]}.json`;
        var testLabOrder = JSON.parse(fileExtension.parseContent(labOrderFile))
        gauge.dataStore.scenarioStore.put("labOrder" + i, testLabOrder)
        gauge.message(testLabOrder)
        await taikoHelper.repeatUntilFound(text(testLabOrder.test))
        await click(testLabOrder.test, { force: true })
        await waitFor(100)
    }
});


step("put medications <prescriptionNames>", async function (prescriptionNames) {
    var prescriptionFile = `./data/${prescriptionNames}.json`;
    gauge.dataStore.scenarioStore.put("prescriptions", prescriptionFile)
})

step("Doctor prescribes medicines <prescriptionNames>", async function (prescriptionNames) {
    var prescriptionsList = prescriptionNames.split(',')
    var prescriptionsCount = prescriptionsList.length
    gauge.dataStore.scenarioStore.put("prescriptionsCount", prescriptionsCount)
    for (var i = 0; i < prescriptionsCount; i++) {

        var prescriptionFile = `./bahmni-e2e-common-flows/data/${prescriptionsList[i]}.json`;
        gauge.dataStore.scenarioStore.put("prescriptions" + i, prescriptionFile)
        var drugName = gauge.dataStore.scenarioStore.get("Drug Name")
        var medicalPrescriptions = JSON.parse(fileExtension.parseContent(prescriptionFile))
        gauge.message(medicalPrescriptions)

        if (medicalPrescriptions.drug_name != null) {
            if (drugName == null)
                drugName = medicalPrescriptions.drug_name;
            if (await textBox(toRightOf("Drug Name")).exists()) {
                await write(drugName, into(textBox(toRightOf("Drug Name"))));
                await click(link(drugName, below(textBox(toRightOf("Drug Name")))));
                if (medicalPrescriptions.assertUnits == "true") {
                    assert.equal(await getDropDownValueFromMedications('uniform-dose-unit'), medicalPrescriptions.units);
                } else {
                    await dropDown(toRightOf("Units")).select(medicalPrescriptions.units);
                }
                await dropDown(toRightOf("Frequency")).select(medicalPrescriptions.frequency)
                if (medicalPrescriptions.assertRoute == "true") {
                    assert.equal(await getDropDownValueFromMedications('route'), medicalPrescriptions.route);
                }
                await write(medicalPrescriptions.dose, into(textBox(toRightOf("Dose"))));
                await write(medicalPrescriptions.duration, into(textBox(toRightOf("Duration"))));
                await write(medicalPrescriptions.notes, into(textBox(toRightOf("Additional Instructions"))));
            }
            await click("Add");
        }

    }
}
);

async function getDropDownValueFromMedications(selector) {
    return (await dropDown({ id: selector }).value()).replace("string:", "").trim();
    // evaluate(() => {
    //     const dropdown = document.querySelector(selector);
    //     let selectedValue = dropdown.options[dropdown.selectedIndex].value;
    //     selectedValue = selectedValue.replace("String:", "").trim();
    //     return selectedValue;
    // })
}


step("Doctor captures consultation notes <notes>", async function (notes) {
    gauge.dataStore.scenarioStore.put("consultationNotes", notes)
    await click("Consultation", { force: true, waitForNavigation: true, waitForStart: 2000 });
    await waitFor(textBox({ placeholder: "Enter Notes here" }))
    await write(notes, into(textBox({ "placeholder": "Enter Notes here" })), { force: true })
    gauge.dataStore.scenarioStore.put("consultationNotes", notes);
});

step("Doctor clicks consultation", async function () {
    await click("Consultation", { force: true, waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Choose Disposition", async function () {
    await click("Disposition", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Doctor advises admitting the patient", async function () {
    await waitFor(async () => (await dropDown("Disposition Type").exists()))
    await dropDown("Disposition Type").select('Admit Patient')
    await write("Admission Notes", into(textBox(below("Disposition Notes"))))
});

step("Doctor advises discharging the patient", async function () {
    await waitFor(async () => (await dropDown("Disposition Type").exists()))
    await dropDown("Disposition Type").select('Discharge Patient')
    await write("Discharge Notes", into(textBox(below("Disposition Notes"))))
});

step("Open <tabName> Tab", async function (tabName) {
    await click(link(tabName), { waitForNavigation: true, navigationTimeout: process.env.actionTimeout, force: true });
    await taikoHelper.repeatUntilNotFound($("#overlay"))
});

step("Save visit data", async function () {
    await click("Save", { waitForNavigation: true, navigationTimeout: process.env.actionTimeout });
});

step("Join teleconsultation", async function () {
    await scrollTo('Join Teleconsultation')
    await click('Join Teleconsultation');
    await taikoHelper.repeatUntilNotFound($("#overlay"))
    await scrollTo(button('Join teleconsultation'), toRightOf("Scheduled"))
    await click(button('Join teleconsultation', toRightOf("Scheduled")), { waitForNavigation: false, navigationTimeout: 3000 })
    await highlight('Tele Consultation')
    await click(($('[ng-click="closeTeleConsultation()"]')));
});

step("Doctor notes the diagnosis and condition <filePath>", async function (filePath) {
    var diagnosisFile = `./bahmni-e2e-common-flows/data/${filePath}.json`;
    gauge.dataStore.scenarioStore.put("diagnosisFile", diagnosisFile)
    var medicalDiagnosis = JSON.parse(fileExtension.parseContent(diagnosisFile))
    gauge.dataStore.scenarioStore.put("medicalDiagnosis", medicalDiagnosis)
    gauge.message(medicalDiagnosis)
    await click("Diagnoses");
    await write(medicalDiagnosis.diagnosis.diagnosisName, into(textBox(below("Diagnoses"))));
    await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]").isVisible())
    await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.diagnosis.diagnosisName + "\")])[1]"))
    await click(medicalDiagnosis.diagnosis.order, below("Order"));
    await click(medicalDiagnosis.diagnosis.certainty, below("Certainty"));
    for (var i = 0; i < medicalDiagnosis.condition.length; i++) {
        await write(medicalDiagnosis.condition[i].conditionName, into(textBox(below("Condition"))));
        await waitFor(() => $("(//A[starts-with(text(),\"" + medicalDiagnosis.condition[i].conditionName + "\")])[1]").isVisible())
        await click($("(//A[starts-with(text(),\"" + medicalDiagnosis.condition[i].conditionName + "\")])[1]"))
        await click(medicalDiagnosis.condition[i].status, below($("//div[@class='col col2']//*[contains(text(),'Status')]")));
        await click("Add", below("Action"))
    }
});