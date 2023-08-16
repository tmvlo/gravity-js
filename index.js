let intervalState;
const selectedFilter = {};
const select = {};
let resultListFilter = [];
let hiddenTabs;

const setHiddenClick = () => {
    hiddenTabs = document.querySelector('.tab-link-select-programa-2')
}

const hidden = () => {
    hiddenTabs.click();
}

function convertToRange(str) {
    if (str.includes("or above")) {
        const number = parseInt(str.replace(/[^0-9]/g, ''));
        return { min: number, max: Infinity };
    } else if (str.includes("or under")) {
        const number = parseInt(str.replace(/[^0-9]/g, ''));
        return { min: -Infinity, max: number };
    } else if (str.includes("Any Fee")) {
        return { showAny: true };
    } else {
        const numbers = str.replace(/[^0-9\-]/g, '').split('-').map(Number);
        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers)
        };
    }
}

function isPartiallyWithinRange(target, range) {
    return (target.min >= range.min && target.min <= range.max) || (target.max >= range.min && target.max <= range.max);
}

function isWithinAnyOfTheRanges(number, specificRanges) {
    return specificRanges.some(range => {
        const rangeLimits = convertToRange(range);
        return isPartiallyWithinRange(number, rangeLimits);
    });
}

const blockOrHidden = (element, textSearch, valueToSearch) => {
    const parentElement = element.closest('.w-dyn-item');
    if (!textSearch.includes(valueToSearch)) {
        parentElement.style.display = 'none';
    } else {
        parentElement.style.display = 'block';
        resultListFilter.push(parentElement);
    }
}

const searchByIncludes = (element, value, searchBy = 'topic') => {
    const allFieldTopics = resultListFilter.length > 0 ? resultListFilter : document.querySelectorAll(`[filter-field="${searchBy}"]:not(.w-dyn-bind-empty)`);
    resultListFilter = [];
    allFieldTopics.forEach((element) => {
        if (Array.isArray(allFieldTopics)) {
            const l = element.querySelectorAll(`[filter-field="${searchBy}"]`);
            l.forEach((currentValue) => {
                blockOrHidden(currentValue, currentValue.innerText, value)
            })
        } else {
            blockOrHidden(element, element.innerText, value);
        }
    });
}

const renewFilter = () => {
    const { topic, fee, location, program, search } = select;
    const allSpeakers = document.querySelectorAll('.collection-list-search .w-dyn-item');
    resultListFilter = [];

    allSpeakers.forEach((speaker) => {
        let pass = true;
        const currentTopic = speaker.querySelector('[filter-field="topic"]');
        const currentSubTopic = speaker.querySelector('[filter-field="subtopic"]');
        const currentLocation = speaker.querySelector('[filter-field="location"]');
        const currentFee = speaker.querySelector('.wrapper-fee');
        const currentProgram = speaker.querySelector('[filter-field="program"]')
        const currentName = speaker.querySelector('.item-data .link-11')

        if (topic) { pass = currentTopic.innerText.includes(topic) || currentSubTopic.innerText.includes(topic); }

        if (fee && pass) {
            const numberRange = convertToRange(fee);
            const rangeValues = currentFee.querySelectorAll('[filter-field]:not(.w-dyn-bind-empty)');
            if (!numberRange.hasOwnProperty('showAny')) {
                const specificRanges = [...rangeValues].map((element) => element.innerText.trim());
                pass = isWithinAnyOfTheRanges(numberRange, specificRanges);
            } else {
                pass = true;
            }
        }

        if (location && pass) { pass = currentLocation.innerText.includes(location); }

        if (program && pass) { pass = currentProgram.innerText.includes(program); }

        if(search && pass ) { 
            const expresion = new RegExp(`${search}.*`, "i");
            const name = currentName?.innerText;
            pass = expresion.test(name);
        }

        if (pass) {
            speaker.style.display = 'block';
            resultListFilter.push(speaker);
        } else {
            speaker.style.display = 'none';
        }
    })
}

const showOrHiddenLabels = (currentLabel, value, remove) => {
    currentLabel.forEach((current, idx) => {
        if (value) current.innerHTML = value;
        if (idx === 0) {
            if (remove) current.closest('.wrapper-remove').classList.remove('remove-hidden');
            else current.closest('.wrapper-remove').classList.add('remove-hidden');
        } else {
            if (remove) current.parentElement.classList.remove('hidden');
            else current.parentElement.classList.add('hidden');
        }
    })
}

const setSelected = (label, option, value) => {
    selectedFilter[option] = { 'label': label, value: value };
    if (selectedFilter) {
        const wrapperResults = document.querySelector('.wrapper-results');
        wrapperResults.classList.remove('hidden');

        Object.entries(selectedFilter).forEach(([one, two]) => {
            const { label, value } = two;
            const currentLabel = document.querySelectorAll(`.${label}`);
            showOrHiddenLabels(currentLabel, value, true);
        })
        hidden();
    }
}

const setTopicsFilter = () => {
    const topics = document.querySelectorAll('.label-topic');
    const subTopics = document.querySelectorAll('.label-subtopic');

    topics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-topic');
            if (!select.hasOwnProperty('topic')) {
                select['topic'] = value;
                searchByIncludes(element, value);
            } else {
                select['topic'] = value;
                renewFilter();
            }
            setSelected('topic-label', 'topic', value)
        });
    });

    subTopics.forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const value = element.getAttribute('filter-subtopic');
            if (!select.hasOwnProperty('topic')) {
                select['topic'] = value;
                searchByIncludes(element, value, 'subtopic');
            } else {
                select['topic'] = value;
                renewFilter();
            }
            setSelected('topic-label', 'topic', value)
        });
    });
}

const setFeeFilter = () => {
    const elements = document.querySelectorAll('.text-range-item');
    elements.forEach((item) => {
        item.addEventListener('click', (e) => {
            const number = item.getAttribute('filter-fee');
            const numberRange = convertToRange(number);
            let specificRanges = [];

            if (!select.hasOwnProperty('fee')) {
                select['fee'] = number;
                const specificRangeElements = resultListFilter.length > 0 ? resultListFilter : document.querySelectorAll('.wrapper-fee');
                resultListFilter = [];
                specificRangeElements.forEach((range) => {
                    if (Array.isArray(range)) {
                        const currentFee = range.querySelector('.wrapper-fee');
                        const rangeValues = currentFee.querySelectorAll('[filter-field]:not(.w-dyn-bind-empty)');
                        if (!numberRange.hasOwnProperty('showAny')) {
                            specificRanges = [...rangeValues].map((element) => element.innerText.trim());
                            if (isWithinAnyOfTheRanges(numberRange, specificRanges)) {
                                range.style.display = "block";
                                resultListFilter.push(range);
                            } else {
                                range.style.display = "none";
                            }
                        } else {
                            range.style.display = "block";
                            resultListFilter.push(range)
                        }
                    } else {
                        const rangeValues = range.querySelectorAll('[filter-field]:not(.w-dyn-bind-empty)');
                        if (!numberRange.hasOwnProperty('showAny')) {
                            specificRanges = [...rangeValues].map((element) => element.innerText.trim());
                            if (isWithinAnyOfTheRanges(numberRange, specificRanges)) {
                                range.closest('.w-dyn-item').style.display = "block";
                            } else {
                                range.closest('.w-dyn-item').style.display = "none";
                            }
                        } else {
                            range.closest('.w-dyn-item').style.display = "block";
                        }
                    }

                });
            } else {
                select['fee'] = number;
                renewFilter();
            }
            setSelected('fee-label', 'fee', number);
        });
    });
}

const setLocationFilter = () => {

    const locations = [];
    const removeRepeat = () => {
        const labelsLocations = document.querySelectorAll('.label-locations');
        labelsLocations.forEach((location) => {
            if (locations.includes(location.innerText)) {
                location.parentElement.remove();
            } else {
                locations.push(location.innerText)
            }
        })
    }

    const setEventClick = () => {
        const labelsLocations = document.querySelectorAll('.label-locations');
        labelsLocations.forEach((location) => {
            location.addEventListener('click', (e) => {
                e.preventDefault();
                const value = location.getAttribute('filter-location');
                if (!select.hasOwnProperty('location')) {
                    select['location'] = value;
                    searchByIncludes(location, value, 'location');
                } else {
                    select['location'] = value;
                    renewFilter();
                }
                setSelected('location-label', 'location', value)
            });
        })
    }

    removeRepeat();
    setEventClick();
}

const setProgramFilter = () => {

    const programs = document.querySelectorAll('.label-program');
    
    programs.forEach((program) => {
        program.addEventListener('click', (e) => {
            e.preventDefault();
            const value = program.getAttribute('filter-program');
            if(!select.hasOwnProperty('program')){
                select['program'] = value;
                searchByIncludes(program, value, 'program');
            } else {
                select['program'] = value;
                renewFilter();
            }
            setSelected('program-label', 'program', value);
        });
    })
}

const setCloseFilters = () => {
    const allBtns = document.querySelectorAll('[data-property]');

    allBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const { property } = btn.dataset;
            delete select[property];
            delete selectedFilter[property];
            const currentLabels = document.querySelectorAll(`.${property}-label`);
            showOrHiddenLabels(currentLabels, null, false);
            renewFilter();
            setTimeout(() => {
                hidden();
            }, 100);
        });
    })
}

const setInputSearch = () => {
    const inputSearch = document.querySelector('.text-field-7.w-input');
    let timeOut;

    inputSearch?.addEventListener('keyup', (e) => {
        clearTimeout(timeOut);
        
        timeOut = setTimeout(()=> {
            const allSpeakers = resultListFilter.length > 0 && inputSearch.value ? resultListFilter : document.querySelectorAll('.collection-list-search .w-dyn-item');
            resultListFilter = [];
            allSpeakers.forEach((element) => {
                const expresion = new RegExp(`${inputSearch.value}.*`, "i");
                const name = element.querySelector('.item-data .link-11')?.innerText;
                if(expresion.test(name)){
                    element.style.display = 'block';
                    resultListFilter.push(element);
                } else {
                    element.style.display = 'none';   
                }
            })
            select['search'] = inputSearch.value;
        }, 200)
    });
}

intervalState = setInterval(() => {
    if (document.readyState === 'complete') {
        clearInterval(intervalState)
        setHiddenClick();
        setTopicsFilter();
        setFeeFilter();
        setLocationFilter();
        setProgramFilter();
        setInputSearch();
        setCloseFilters();
    }
}, 100);
