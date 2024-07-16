/*
 * Script Name: Set/Get Village Notes
 * Version: v1.3.0
 * Last Updated: 2023-04-19
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: t14272680
 * Approved Date: 2020-10-08
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'setGetVillageNotes',
        name: 'Set/Get Village Notes',
        version: 'v1.3.0',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/set-get-village-note.286051/',
    },
    translations: {
        en_DK: {
            'Set/Get Village Notes': 'Set/Get Village Notes',
            Help: 'Help',
            'Note added!': 'Note added!',
            'Note can not be added for this report!':
                'Note can not be added for this report!',
            'Report Link': 'Report Link',
            'No notes found for this village!':
                'No notes found for this village!',
            'This script requires Premium Account to be active!':
                'This script requires Premium Account to be active!',
            'Finished!': 'Finished!',
            'Off. Troops:': 'Off. Troops:',
            'Def. Troops:': 'Def. Troops:',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['report', 'info_command'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const isAllowedScreen = twSDK.checkValidLocation('screen');

        (function () {
            const gameScreen = twSDK.getParameterByName('screen');
            const gameView = twSDK.getParameterByName('view');
            const commandId = twSDK.getParameterByName('id');

            if (game_data.features.Premium.active) {
                if (isAllowedScreen) {
                    if (gameScreen === 'report' && gameView !== null) {
                        setTimeout(function () {
                            initSetVillageNote();
                        }, 300);
                    } else if (
                        gameScreen === 'info_command' &&
                        commandId !== null
                    ) {
                        initGetVillageNote();
                    } else {
                        twSDK.redirectTo('report');
                    }
                } else {
                    twSDK.redirectTo('report');
                }
            } else {
                UI.ErrorMessage(
                    twSDK.tt(
                        'This script requires Premium Account to be active!'
                    )
                );
            }
        })();

        // Init Set Village Notes
        function initSetVillageNote() {
            let noteText = '';
            let villageId;

            let attackingVillageTroops = [];
            let attackingVillageTroopsData = [];
            let attackingTroopTotalFarmSpace = {};
            let offTroopsFarmSpace = 0;
            let defTroopsFarmSpace = 0;

            let unitsFarmSpace = {
                spear: 1,
                sword: 1,
                axe: 1,
                archer: 1,
                spy: 2,
                light: 4,
                marcher: 5,
                heavy: 6,
                ram: 5,
                catapult: 8,
                knight: 10,
                snob: 100,
            };

            const reportTime = jQuery('table#attack_info_def')[0].parentNode
                .parentNode.parentNode.rows[1].cells[1].textContent;
            const defenderPlayerName = jQuery('table#attack_info_def')[0]
                .rows[0].cells[1].textContent;

            const reportId = twSDK.getParameterByName('view');
            const reportLink = `${window.location.origin}/game.php?screen=report&mode=all&view=${reportId}`;

            if (defenderPlayerName !== '---') {
                // Prepare note data
                if (defenderPlayerName == game_data.player.name) {
                    villageId = jQuery('table#attack_info_att')[0]
                        .rows[1].cells[1].getElementsByTagName('span')[0]
                        .getAttribute('data-id');

                    jQuery('#attack_info_att_units tr:eq(1) td.unit-item').each(
                        function () {
                            attackingVillageTroops.push(
                                parseInt(jQuery(this).text().trim())
                            );
                        }
                    );
                } else {
                    villageId = jQuery('table#attack_info_def')[0]
                        .rows[1].cells[1].getElementsByTagName('span')[0]
                        .getAttribute('data-id');
                }

                game_data.units.map((unit, index) => {
                    attackingVillageTroopsData.push({
                        unitType: unit,
                        unitAmount: attackingVillageTroops[index],
                    });
                });

                attackingVillageTroopsData.forEach((item) => {
                    const unitFarmAmount =
                        item.unitAmount * unitsFarmSpace[item.unitType];
                    if (!isNaN(unitFarmAmount)) {
                        attackingTroopTotalFarmSpace = {
                            ...attackingTroopTotalFarmSpace,
                            [item.unitType]: unitFarmAmount,
                        };
                    }
                });

                const offUnitTypes = ['axe', 'light', 'ram', 'catapult'];
                const defUnitTypes = ['spear', 'sword', 'heavy'];

                offUnitTypes.forEach((unit) => {
                    offTroopsFarmSpace += attackingTroopTotalFarmSpace[unit];
                });

                defUnitTypes.forEach((unit) => {
                    defTroopsFarmSpace += attackingTroopTotalFarmSpace[unit];
                });

                noteText += '[b]' + reportTime + '[/b]\n';
                if (!isNaN(offTroopsFarmSpace)) {
                    noteText +=
                        '[b]' +
                        twSDK.tt('Off. Troops:') +
                        '[/b] ' +
                        twSDK.formatAsNumber(offTroopsFarmSpace) +
                        '\n';
                }
                if (!isNaN(defTroopsFarmSpace)) {
                    noteText +=
                        '[b]' +
                        twSDK.tt('Def. Troops:') +
                        '[/b] ' +
                        twSDK.formatAsNumber(defTroopsFarmSpace) +
                        '\n';
                }

                noteText += '\n' + $('#report_export_code')[0].innerHTML + '\n';
                noteText += `[url="${reportLink}"]${twSDK.tt(
                    'Report Link'
                )}[/url]`;

                // Add note on village
                TribalWars.post(
                    'info_village',
                    {
                        ajaxaction: 'edit_notes',
                        id: villageId,
                    },
                    {
                        note: noteText,
                    },
                    function () {
                        UI.SuccessMessage(twSDK.tt('Note added!'));
                        if (jQuery('#report-next').length) {
                            document.getElementById('report-next').click();
                        } else {
                            UI.SuccessMessage(twSDK.tt('Finished!'));
                            window.location.assign(
                                game_data.link_base_pure + 'report'
                            );
                        }
                    }
                );
            } else {
                UI.ErrorMessage(
                    twSDK.tt('Note can not be added for this report!')
                );
            }
        }

        // Init Get Village Notes
        function initGetVillageNote() {
            $.get(
                $('.village_anchor').first().find('a').first().attr('href'),
                function (html) {
                    const note = jQuery(html).find(
                        '#own_village_note .village-note'
                    );
                    if (note.length > 0) {
                        const noteContent = `
                            <div id="ra-village-notes" class="vis">
                                <div class="ra-village-notes-body">
                                    ${note[0].children[1].innerHTML}
                                </div>
                            </div>
                            <style>
                                #ra-village-notes { position: relative; display: block; width: 100%; height: auto; clear: both; margin: 15px auto; padding: 10px; box-sizing: border-box; }
                                .ra-village-notes-footer { margin-top: 15px; }
                            </style>
                        `;
                        jQuery('#content_value table:eq(0)').after(noteContent);
                    }
                }
            );
        }
    }
);
