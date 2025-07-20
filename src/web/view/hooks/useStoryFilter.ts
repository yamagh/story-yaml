
import { useState, useMemo } from 'react';
import { StoryFile, Status, Item, Story, Task, Epic } from '../../types';

const itemHasStatus = (item: any): item is Task | Story => 'status' in item;
const itemHasSprint = (item: any): item is Task | Story => 'sprint' in item;

export const useStoryFilter = (storyData: StoryFile | null) => {
    const [filterStatus, setFilterStatus] = useState<Status[]>([]);
    const [filterSprint, setFilterSprint] = useState<string>('');
    const [filterKeyword, setFilterKeyword] = useState<string>('');

    const filteredData = useMemo(() => {
        if (!storyData) {
            return { epics: [], tasks: [] };
        }

        const lowerCaseKeyword = filterKeyword.toLowerCase();

        const keywordFilter = (item: Item): boolean => {
            if (!lowerCaseKeyword) return true;
            const titleMatch = item.title.toLowerCase().includes(lowerCaseKeyword);
            const descriptionMatch = item.description?.toLowerCase().includes(lowerCaseKeyword) ?? false;
            return titleMatch || descriptionMatch;
        };

        const statusFilter = (item: Item): boolean => {
            if (filterStatus.length === 0) return true;
            return itemHasStatus(item) && filterStatus.includes(item.status);
        };

        const sprintFilter = (item: Item): boolean => {
            if (!filterSprint) return true;
            return itemHasSprint(item) && item.sprint === filterSprint;
        };

        const combinedFilter = (item: Item) => keywordFilter(item) && statusFilter(item) && sprintFilter(item);

        const filteredTasks = storyData.tasks.filter(combinedFilter);

        const filteredEpics = storyData.epics.map(epic => {
            const filteredStories = epic.stories?.filter(combinedFilter) || [];
            
            // Epic itself matches or it has stories that match
            if (keywordFilter(epic) || filteredStories.length > 0) {
                return { ...epic, stories: filteredStories };
            }
            return null;
        }).filter((epic): epic is Epic => epic !== null);


        return { epics: filteredEpics, tasks: filteredTasks };

    }, [storyData, filterStatus, filterSprint, filterKeyword]);

    return {
        filteredData,
        setFilterStatus,
        setFilterSprint,
        setFilterKeyword,
        filterStatus,
        filterSprint,
        filterKeyword,
    };
};
